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
import { getNightActionResource } from "./role-resource-limits";
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

  const visits = collectVisits(activeEffects);
  // Framer e Disguiser só enganam investigações da Town (e neutras), nunca a própria Mafia.
  const framedUids = new Set(activeEffects
    .filter(({ roleId }) => roleId === "framer")
    .flatMap(({ targetUids }) => targetUids));
  const disguises = new Map(activeEffects
    .filter(({ roleId, targetUids }) => roleId === "disguiser" && targetUids[0])
    .map(({ actorUid, targetUids }) => [actorUid, targetUids[0]]));
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
    const disguiseUid = disguises.get(uid);
    return disguiseUid ? playersByUid.get(disguiseUid)! : player;
  };
  const lookoutResult = (watchedUid: string, effect: EngineEffect) => {
    const visitors = [...new Set(visits
      .filter((visit) => visit.targetUid === watchedUid && visit.sourceActionId !== effect.id)
      .map((visit) => visit.visitorUid
        ? appearanceFor(visit.visitorUid, effect.actorUid).name
        : "a Mafia"))].sort();
    return visitors.length > 0 ? `visitado por ${visitors.join(", ")}` : "ninguém visitou";
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
  const revivedUids = [...new Set(activeEffects
    .filter(({ roleId, actionId }) => roleId === "retributionist" && actionId === "revive")
    .flatMap(({ targetUids }) => targetUids)
    .filter((uid) => {
      const target = playersByUid.get(uid);
      return target && !target.alive && target.faction === "town";
    }))].sort();
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
      })),
    randomDecisions,
    roleChanges: triggers.roleChanges,
    individualWinnerUids: triggers.individualWinnerUids,
    revivedUids,
    partial: warnings.length > 0,
  };
}
