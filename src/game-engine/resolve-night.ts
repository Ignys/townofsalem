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

export function resolveNight(
  gameState: EngineGameState,
  actions: readonly EngineNightAction[],
  options: ResolveNightOptions = {},
): NightResolution {
  const playersByUid = new Map(gameState.players.map((player) => [player.uid, player]));
  const variants = withDefaultVariants(gameState.variants);
  const generated = createEffects(actions);
  const effects = sortEffectsByPriority(generated.effects);
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
      const result = target
        ? getInvestigationResult(
          target,
          effect.investigationType,
          gameState.nightNumber ?? 1,
          variants,
        )
        : null;
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
      for (const targetUid of effect.targetUids) {
        const statusType = effect.actionId === "choose-execution-target"
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

    if (effect.effectType === "redirect") {
      failedActions.add(effect.id);
      warnings.push(warning(
        "UNSUPPORTED_EFFECT",
        "O redirecionamento ainda não possui regra física confirmada.",
        effect.id,
      ));
      continue;
    }

    if (effect.effectType === "role-trigger") {
      appliedEffects.push(effect);
      continue;
    }

    appliedEffects.push(effect);
  }

  const visits = collectVisits(activeEffects);
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
    removedStatuses: gameState.players
      .filter(({ statuses }) => statuses.includes("town-blocked-next-night"))
      .map(({ uid }) => ({
        targetUid: uid,
        statusType: "town-blocked-next-night",
      })),
    randomDecisions,
    roleChanges: triggers.roleChanges,
    consumedResources: combat.consumedResources,
    individualWinnerUids: triggers.individualWinnerUids,
    partial: warnings.length > 0,
  };
}
