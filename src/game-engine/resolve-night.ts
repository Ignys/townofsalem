import { resolveCombat } from "./combat";
import { createEffects } from "./effect-registry";
import { getInvestigationResult } from "./investigation";
import { isEngineActionAvailableOnNight } from "./night-action-availability";
import { sortEffectsByPriority } from "./priority";
import {
  createRandomRecorder,
  createSeededRandomSource,
  type RandomSource,
} from "./random";
import {
  EXECUTIONER_TARGET_STATUS_PREFIX,
  getChosenExecutionTarget,
} from "./role-rules";
import { getNightActionResource, getRoleResourceLimit } from "./role-resource-limits";
import { resolveRoleTriggers } from "./role-triggers";
import type {
  EngineEffect,
  EngineEvent,
  EngineGameState,
  EngineNightAction,
  EngineRandomDecision,
  EngineWarning,
  InvestigationResult,
  NightResolution,
} from "./types";
import { withDefaultVariants } from "./variants";
import { collectVisits } from "./visits";

/** Status do Disguiser; o sufixo é a role que a lápide dele vai mostrar. */
export const DISGUISE_STATUS_PREFIX = "disguised-as:";

export const MAX_LIVING_VAMPIRES = 4;
/** Posto em todos os Vampiros depois de uma conversão: na noite seguinte ninguém morde. */
export const VAMPIRE_COOLDOWN_STATUS = "vampire-bite-cooldown";
/** Noite em que o jogador virou Vampiro; o mais recente é quem morde. */
export const VAMPIRE_TURNED_STATUS_PREFIX = "vampire-turned:";
const VAMPIRE_CONVERTIBLE_NEUTRALS = new Set(["amnesiac", "executioner", "jester"]);

export interface ResolveNightOptions {
  randomSource?: RandomSource;
}

function warning(code: string, message: string, actionId?: string): EngineWarning {
  return { code, message, ...(actionId ? { actionId } : {}) };
}

function referencesAreValid(
  effect: EngineEffect,
  playersByUid: ReadonlyMap<string, EngineGameState["players"][number]>,
): boolean {
  const actorExists = effect.sourceType === "faction" || playersByUid.has(effect.actorUid);
  return actorExists && effect.targetUids.every((uid) => playersByUid.has(uid));
}

/** Transporter: toda ação que miraria um dos dois trocados acerta o outro. */
function applyTransports(
  effects: readonly EngineEffect[],
  playersByUid: ReadonlyMap<string, EngineGameState["players"][number]>,
  nightNumber: number,
): readonly EngineEffect[] {
  const swaps = effects.filter((effect) => {
    const actor = playersByUid.get(effect.actorUid);
    return effect.effectType === "redirect"
      && effect.targetUids.length === 2
      && actor?.alive
      && !actor.statuses.includes("town-blocked-next-night")
      && isEngineActionAvailableOnNight(effect, nightNumber);
  });
  if (swaps.length === 0) return effects;
  const swap = (uid: string) => swaps.reduce(
    (current, { targetUids: [left, right] }) =>
      current === left ? right : current === right ? left : current,
    uid,
  );
  return effects.map((effect) => effect.effectType === "redirect"
    ? effect
    : { ...effect, targetUids: effect.targetUids.map(swap) });
}

export function resolveNight(
  gameState: EngineGameState,
  actions: readonly EngineNightAction[],
  options: ResolveNightOptions = {},
): NightResolution {
  const playersByUid = new Map(gameState.players.map((player) => [player.uid, player]));
  const variants = withDefaultVariants(gameState.variants);
  const generated = createEffects(actions);
  const effects = applyTransports(
    sortEffectsByPriority(generated.effects),
    playersByUid,
    gameState.nightNumber ?? 1,
  );
  const warnings: EngineWarning[] = [...generated.warnings];
  const events: EngineEvent[] = [];
  const appliedEffects: EngineEffect[] = [];
  const blockedActors = new Set<string>();
  const blockedActions = new Set<string>();
  const failedActions = new Set<string>();
  const activeEffects: EngineEffect[] = [];
  const investigationResults: InvestigationResult[] = [];
  const appliedStatuses: Array<{
    targetUid: string;
    statusType: string;
    sourceActionId: string;
  }> = [];
  const randomDecisions: EngineRandomDecision[] = [];
  const randomSource = options.randomSource ?? createSeededRandomSource(
    `${gameState.gameId}:${gameState.nightId}`,
  );
  const choose = createRandomRecorder(randomSource, randomDecisions);

  for (const effect of effects) {
    if (!referencesAreValid(effect, playersByUid)) {
      failedActions.add(effect.id);
      warnings.push(warning(
        "INVALID_ENGINE_REFERENCE",
        "Ator ou alvo não existe no snapshot.",
        effect.id,
      ));
      continue;
    }
    const actor = playersByUid.get(effect.actorUid);
    if (
      !isEngineActionAvailableOnNight(effect, gameState.nightNumber ?? 1)
      || (!actor?.alive && effect.sourceType !== "faction")
      || actor?.statuses.includes("town-blocked-next-night")
    ) {
      failedActions.add(effect.id);
      events.push({
        type: "ACTION_UNAVAILABLE",
        actorUid: effect.actorUid,
        actionId: effect.id,
        reasonCode: !actor?.alive
          ? "ACTOR_IS_DEAD"
          : actor.statuses.includes("town-blocked-next-night")
            ? "TOWN_BLOCKED_BY_SURVIVOR_LYNCH"
            : "ACTION_UNAVAILABLE_THIS_NIGHT",
      });
      continue;
    }
    if (blockedActors.has(effect.actorUid)) {
      blockedActions.add(effect.id);
      events.push({
        type: "ACTION_BLOCKED",
        actorUid: effect.actorUid,
        actionId: effect.id,
        reasonCode: "ACTOR_ROLEBLOCKED",
      });
      continue;
    }

    if (effect.effectType === "roleblock") {
      effect.targetUids.forEach((uid) => blockedActors.add(uid));
      appliedEffects.push(effect);
      events.push(...effect.targetUids.map((targetUid) => ({
        type: "PLAYER_ROLEBLOCKED",
        actorUid: effect.actorUid,
        targetUid,
        actionId: effect.id,
        reasonCode: "ROLEBLOCK_APPLIED",
      })));
      continue;
    }

    if (
      effect.effectType === "protect"
      && effect.blockedByTargetStatuses?.some((status) =>
        effect.targetUids.some((targetUid) =>
          playersByUid.get(targetUid)?.statuses.includes(status),
        ),
      )
    ) {
      failedActions.add(effect.id);
      events.push({
        type: "PROTECTION_BLOCKED",
        actorUid: effect.actorUid,
        targetUid: effect.targetUids[0],
        actionId: effect.id,
        reasonCode: "TARGET_STATUS_BLOCKS_PROTECTION",
      });
      continue;
    }

    activeEffects.push(effect);
  }

  // Vampire Hunter: descobre se o alvo é Vampiro e, se for, o ataca.
  for (const hunt of activeEffects.filter(({ roleId, actionId }) => roleId === "vampire-hunter" && actionId === "hunt")) {
    const target = playersByUid.get(hunt.targetUids[0]);
    if (!target) continue;
    const isVampire = target.roleId === "vampire";
    investigationResults.push({
      actorUid: hunt.actorUid,
      targetUid: target.uid,
      investigationType: "vampire-hunter",
      result: isVampire ? "vampire" : "não é um Vampire",
      sourceActionId: hunt.id,
    });
    if (isVampire) {
      activeEffects.push({ ...hunt, id: `${hunt.id}:stake`, actionId: "stake", effectType: "attack", priority: 50, countsAsVisit: false });
    }
  }

  // Vampiros: o convertido mais recentemente morde o alvo da votação.
  const nightNumber = gameState.nightNumber ?? 1;
  const livingVampires = gameState.players.filter(({ alive, roleId }) => alive && roleId === "vampire");
  const turnedOn = (uid: string) => Number(playersByUid.get(uid)?.statuses
    .find((status) => status.startsWith(VAMPIRE_TURNED_STATUS_PREFIX))
    ?.slice(VAMPIRE_TURNED_STATUS_PREFIX.length) ?? 0);
  let pendingConversion: { biterUid: string; targetUid: string; sourceActionId: string } | null = null;
  const biteIndex = activeEffects.findIndex(({ actionId }) => actionId === "vampire-bite");
  if (biteIndex >= 0) {
    const [bite] = activeEffects.splice(biteIndex, 1);
    const target = playersByUid.get(bite.targetUids[0])!;
    const youngest = Math.max(...livingVampires.map(({ uid }) => turnedOn(uid)));
    const candidates = livingVampires.filter(({ uid }) => turnedOn(uid) === youngest).map(({ uid }) => uid);
    const biterUid = candidates.length > 0 ? choose(`vampire-biter:${bite.id}`, candidates) : undefined;
    if (!biterUid || target.roleId === "vampire" || livingVampires.some(({ statuses }) => statuses.includes(VAMPIRE_COOLDOWN_STATUS))) {
      failedActions.add(bite.id);
    } else if (blockedActors.has(biterUid)) {
      blockedActions.add(bite.id);
    } else {
      const visit: EngineEffect = { ...bite, actorUid: biterUid, sourceType: "player", participantUids: [biterUid] };
      const convertible = target.roleId !== "vampire-hunter"
        && (target.faction === "town" || VAMPIRE_CONVERTIBLE_NEUTRALS.has(target.roleId));
      if (target.roleId === "vampire-hunter") {
        activeEffects.push(
          visit,
          { ...visit, id: `${bite.id}:hunter`, actorUid: target.uid, roleId: "vampire-hunter", actionId: "stake", effectType: "attack", targetUids: [biterUid], countsAsVisit: false },
        );
      } else if (convertible && livingVampires.length < MAX_LIVING_VAMPIRES) {
        activeEffects.push(visit);
        pendingConversion = { biterUid, targetUid: target.uid, sourceActionId: bite.id };
      } else {
        activeEffects.push({ ...visit, effectType: "attack" });
      }
      appliedEffects.push(visit);
    }
  }

  const visits = collectVisits(activeEffects);
  // O Framer só engana investigações da Town (e neutras), nunca a própria Mafia.
  const framedUids = new Set(activeEffects
    .filter(({ roleId }) => roleId === "framer")
    .flatMap(({ targetUids }) => targetUids));
  const appearanceFor = (uid: string, investigatorUid: string) => {
    const player = playersByUid.get(uid)!;
    if (playersByUid.get(investigatorUid)?.faction === "mafia") return player;
    if (framedUids.has(uid)) {
      return {
        ...player,
        roleId: "mafioso",
        faction: "mafia" as const,
        investigativeAppearance: { sheriff: "Evil", "exact-role": "Mafioso" },
      };
    }
    return player;
  };
  const lookoutResult = (watchedUid: string, effect: EngineEffect) => {
    const visitors = [...new Set(visits
      .filter((visit) => visit.targetUid === watchedUid && visit.sourceActionId !== effect.id)
      .flatMap((visit) => {
        if (visit.visitorUid) return [playersByUid.get(visit.visitorUid)!.name];
        // Ataque coletivo: um participante vivo vai até o alvo, o mesmo que o combate sorteia.
        const eligible = visit.participantUids.filter((uid) => playersByUid.get(uid)?.alive);
        return eligible.length > 0
          ? [playersByUid.get(choose(`mafia-attack-representative:${visit.sourceActionId}:${visit.targetUid}`, eligible))!.name]
          : [];
      }))].sort();
    if (visitors.length === 0) return "Seu alvo não foi visitado por ninguém.";
    const names = visitors.length === 1
      ? visitors[0]
      : `${visitors.slice(0, -1).join(", ")} e ${visitors[visitors.length - 1]}`;
    return `Seu alvo foi visitado por ${names}.`;
  };

  for (const effect of activeEffects) {
    if (effect.effectType === "investigate") {
      if (!effect.investigationType) {
        failedActions.add(effect.id);
        warnings.push(warning(
          "INVESTIGATION_TYPE_NOT_CONFIGURED",
          "O tipo de investigação ainda não foi configurado.",
          effect.id,
        ));
        continue;
      }
      const target = playersByUid.get(effect.targetUids[0]);
      const result = !target
        ? null
        : effect.investigationType === "lookout"
          ? lookoutResult(target.uid, effect)
          : getInvestigationResult(
          appearanceFor(target.uid, effect.actorUid),
          effect.investigationType,
          gameState.nightNumber ?? 1,
          variants,
        )
      if (!target || !result) {
        failedActions.add(effect.id);
        warnings.push(warning(
          "INVESTIGATION_MAPPING_NOT_CONFIGURED",
          "A aparência investigativa do alvo ainda não foi configurada.",
          effect.id,
        ));
        continue;
      }
      investigationResults.push({
        actorUid: effect.actorUid,
        targetUid: target.uid,
        investigationType: effect.investigationType,
        result,
        sourceActionId: effect.id,
      });
      appliedEffects.push(effect);
      events.push({
        type: "INVESTIGATION_RESULT",
        actorUid: effect.actorUid,
        targetUid: target.uid,
        actionId: effect.id,
        reasonCode: "INVESTIGATION_RESOLVED",
        details: { result },
      });
      continue;
    }

    if (effect.effectType === "status-effect") {
      if (!effect.statusType) {
        failedActions.add(effect.id);
        warnings.push(warning(
          "STATUS_TYPE_NOT_CONFIGURED",
          "O status aplicado pela ação não foi configurado.",
          effect.id,
        ));
        continue;
      }
      const choosesExecutionTarget = effect.actionId === "choose-execution-target";
      // O Executioner escolhe uma vez só; uma segunda escolha é ignorada.
      if (choosesExecutionTarget && getChosenExecutionTarget(playersByUid.get(effect.actorUid)?.statuses)) {
        failedActions.add(effect.id);
        continue;
      }
      for (const targetUid of effect.targetUids) {
        if (choosesExecutionTarget) {
          appliedStatuses.push({
            targetUid: effect.actorUid,
            statusType: `${EXECUTIONER_TARGET_STATUS_PREFIX}${targetUid}`,
            sourceActionId: effect.id,
          });
        }
        const statusType = choosesExecutionTarget
          ? `execution-target:${effect.actorUid}`
          : effect.statusType;
        appliedStatuses.push({ targetUid, statusType, sourceActionId: effect.id });
        events.push({
          type: "STATUS_APPLIED",
          actorUid: effect.actorUid,
          targetUid,
          actionId: effect.id,
          reasonCode: "STATUS_EFFECT_RESOLVED",
          details: { statusType },
        });
      }
      appliedEffects.push(effect);
      continue;
    }

    if (effect.effectType === "role-trigger") {
      appliedEffects.push(effect);
      continue;
    }

    appliedEffects.push(effect);
  }

  const combat = resolveCombat({
    gameState,
    effects: activeEffects,
    visits,
    variants,
    choose,
  });
  events.push(...combat.events);

  const triggers = resolveRoleTriggers({
    gameState,
    effects: activeEffects,
    appliedStatuses,
    deathRecords: combat.deathRecords,
    events,
    warnings,
    choose,
    variants,
  });
  const deaths = [...new Set(combat.deathRecords.map(({ targetUid }) => targetUid))].sort();
  const roleChanges = [...triggers.roleChanges];
  const vampireResources: Array<{ playerUid: string; resource: string; amount: number }> = [];
  let vampireUids: string[] | undefined;
  if (pendingConversion) {
    const { biterUid, targetUid, sourceActionId } = pendingConversion;
    // Cura, proteção ou Alert impedem a conversão, assim como a morte do alvo.
    const shielded = activeEffects.some((effect) => effect.effectType === "protect"
      && (effect.targetUids.includes(targetUid) || (effect.roleId === "veteran" && effect.actorUid === targetUid)));
    if (shielded || deaths.includes(targetUid)) {
      failedActions.add(sourceActionId);
    } else {
      roleChanges.push({
        playerUid: targetUid,
        fromRoleId: playersByUid.get(targetUid)!.roleId,
        toRoleId: "vampire",
        reasonCode: "VAMPIRE_CONVERTED",
      });
      appliedStatuses.push({ targetUid, statusType: `${VAMPIRE_TURNED_STATUS_PREFIX}${nightNumber}`, sourceActionId });
      vampireUids = [...livingVampires.map(({ uid }) => uid).filter((uid) => !deaths.includes(uid)), targetUid].sort();
      vampireUids.forEach((uid) => appliedStatuses.push({ targetUid: uid, statusType: VAMPIRE_COOLDOWN_STATUS, sourceActionId }));
      events.push({ type: "VAMPIRE_CONVERTED", actorUid: biterUid, targetUid, actionId: sourceActionId, reasonCode: "VAMPIRE_BITE_CONVERTED" });
    }
  }
  // Sem Vampiros vivos (e ao menos um já morto), o Vampire Hunter vira Vigilante com uma bala.
  const vampiresRemain = vampireUids !== undefined || livingVampires.some(({ uid }) => !deaths.includes(uid));
  const someVampireDied = gameState.players.some(({ roleId, alive, uid }) => roleId === "vampire" && (!alive || deaths.includes(uid)));
  if (!vampiresRemain && someVampireDied) {
    for (const hunter of gameState.players.filter(({ alive, roleId, uid }) => alive && roleId === "vampire-hunter" && !deaths.includes(uid))) {
      roleChanges.push({ playerUid: hunter.uid, fromRoleId: "vampire-hunter", toRoleId: "vigilante", reasonCode: "ALL_VAMPIRES_DEAD" });
      const shots = getRoleResourceLimit("vigilante", gameState.players.length) ?? 1;
      if (shots > 1) vampireResources.push({ playerUid: hunter.uid, resource: "vigilante-shot", amount: shots - 1 });
    }
  }
  const revivedUids = [...new Set(activeEffects
    .filter(({ roleId, actionId }) => roleId === "retributionist" && actionId === "revive")
    .flatMap(({ targetUids }) => targetUids)
    .filter((uid) => {
      const target = playersByUid.get(uid);
      return target && !target.alive && target.faction === "town";
    }))].sort();
  const nonTownRoleIds = [...new Set(gameState.players
    .filter(({ faction }) => faction !== "town")
    .map(({ roleId }) => roleId))].sort();
  const forgedRoles = [...new Set(activeEffects
    .filter(({ roleId }) => roleId === "forger")
    .flatMap(({ targetUids }) => targetUids)
    .filter((uid) => deaths.includes(uid)))].sort().flatMap((targetUid) => {
    // Sorteia uma role da Mafia ou neutra da partida, de preferência diferente da verdadeira.
    const realRoleId = playersByUid.get(targetUid)?.roleId;
    const others = nonTownRoleIds.filter((roleId) => roleId !== realRoleId);
    const candidates = others.length > 0 ? others : nonTownRoleIds;
    return candidates.length > 0
      ? [{ targetUid, roleId: choose(`forger-role:${targetUid}`, candidates) }]
      : [];
  });
  // Disguiser: guarda a role do último disfarce (Town ou neutro) para a própria lápide.
  const disguiseRemovals: Array<{ targetUid: string; statusType: string }> = [];
  for (const effect of activeEffects) {
    const target = effect.roleId === "disguiser" ? playersByUid.get(effect.targetUids[0]) : undefined;
    if (!target || target.faction === "mafia") continue;
    const statusType = `${DISGUISE_STATUS_PREFIX}${target.roleId}`;
    appliedStatuses.push({ targetUid: effect.actorUid, statusType, sourceActionId: effect.id });
    playersByUid.get(effect.actorUid)?.statuses
      .filter((status) => status.startsWith(DISGUISE_STATUS_PREFIX) && status !== statusType)
      .forEach((status) => disguiseRemovals.push({ targetUid: effect.actorUid, statusType: status }));
  }
  revivedUids.forEach((targetUid) => events.push({
    type: "PLAYER_REVIVED",
    targetUid,
    reasonCode: "RETRIBUTIONIST_REVIVED_TOWN_MEMBER",
  }));
  deaths.forEach((targetUid) => events.push({
    type: "PLAYER_DIED",
    targetUid,
    reasonCode: combat.deathRecords.find((death) => death.targetUid === targetUid)?.cause
      ?? "NIGHT_KILL_RESOLVED",
  }));

  return {
    nightId: gameState.nightId,
    deaths,
    deathRecords: combat.deathRecords,
    survivors: combat.survivors.filter(({ targetUid }) => !deaths.includes(targetUid)),
    investigationResults,
    appliedEffects,
    blockedActions: [...blockedActions].sort(),
    failedActions: [...failedActions].sort(),
    warnings,
    engineEvents: events,
    cleanedPlayerUids: combat.cleanedPlayerUids,
    appliedStatuses,
    // Cada ação confirmada de uma role com usos limitados gasta um uso, dê certo ou não.
    consumedResources: [
      ...combat.consumedResources,
      ...vampireResources,
      ...actions.flatMap((action) => {
        const resource = action.sourceType === "faction" ? null : getNightActionResource(action.roleId);
        return resource ? [{ playerUid: action.actorUid, resource, amount: 1 }] : [];
      }),
    ],
    removedStatuses: gameState.players
      .filter(({ statuses }) => statuses.includes("town-blocked-next-night"))
      .map(({ uid }) => ({
        targetUid: uid,
        statusType: "town-blocked-next-night",
      }))
      .concat(gameState.players
        .filter(({ statuses }) => statuses.includes(VAMPIRE_COOLDOWN_STATUS))
        .map(({ uid }) => ({ targetUid: uid, statusType: VAMPIRE_COOLDOWN_STATUS })))
      .concat(disguiseRemovals),
    randomDecisions,
    roleChanges,
    vampireUids,
    individualWinnerUids: triggers.individualWinnerUids,
    revivedUids,
    forgedRoles,
    partial: warnings.length > 0,
  };
}
