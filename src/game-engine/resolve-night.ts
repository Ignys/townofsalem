import { resolveAttackAgainstDefense } from "./attack-defense";
import { createEffects } from "./effect-registry";
import { sortEffectsByPriority } from "./priority";
import type {
  EngineEffect,
  EngineEvent,
  EngineGameState,
  EngineNightAction,
  EngineRulesContext,
  EngineWarning,
  InvestigationResult,
  NightResolution,
} from "./types";

function warning(code: string, message: string, actionId?: string): EngineWarning {
  return { code, message, ...(actionId ? { actionId } : {}) };
}

export function resolveNight(
  gameState: EngineGameState,
  actions: readonly EngineNightAction[],
  rulesContext: EngineRulesContext,
): NightResolution {
  const playersByUid = new Map(gameState.players.map((player) => [player.uid, player]));
  const generated = createEffects(actions);
  const effects = sortEffectsByPriority(generated.effects);
  const warnings: EngineWarning[] = [...generated.warnings];
  const events: EngineEvent[] = [];
  const appliedEffects: EngineEffect[] = [];
  const blockedActors = new Set<string>();
  const blockedActions = new Set<string>();
  const failedActions = new Set<string>();
  const protections = new Map<string, Array<{ actionId: string; level: NonNullable<EngineEffect["protectionLevel"]> }>>();
  const attacks: EngineEffect[] = [];
  const postDeathEffects: EngineEffect[] = [];
  const investigationResults: InvestigationResult[] = [];
  const appliedStatuses: Array<{
    targetUid: string;
    statusType: string;
    sourceActionId: string;
  }> = [];

  for (const effect of effects) {
    const actor = playersByUid.get(effect.actorUid);
    const targets = effect.targetUids.map((uid) => playersByUid.get(uid));
    if (!actor || targets.some((target) => !target)) {
      failedActions.add(effect.id);
      warnings.push(warning("INVALID_ENGINE_REFERENCE", "Ator ou alvo não existe no snapshot.", effect.id));
      continue;
    }
    if (blockedActors.has(effect.actorUid)) {
      blockedActions.add(effect.id);
      events.push({ type: "ACTION_BLOCKED", actorUid: effect.actorUid, actionId: effect.id, reasonCode: "ACTOR_ROLEBLOCKED" });
      continue;
    }

    switch (effect.effectType) {
      case "roleblock":
        effect.targetUids.forEach((uid) => blockedActors.add(uid));
        appliedEffects.push(effect);
        events.push(...effect.targetUids.map((targetUid) => ({ type: "PLAYER_ROLEBLOCKED", actorUid: effect.actorUid, targetUid, actionId: effect.id, reasonCode: "ROLEBLOCK_APPLIED" })));
        break;
      case "protect":
        if (!effect.protectionLevel) {
          failedActions.add(effect.id);
          warnings.push(warning("PROTECTION_LEVEL_NOT_CONFIGURED", "O nível da proteção ainda não foi confirmado.", effect.id));
          break;
        }
        if (targets.some((target) =>
          effect.blockedByTargetStatuses?.some((status) =>
            target?.statuses.includes(status),
          ),
        )) {
          failedActions.add(effect.id);
          events.push({
            type: "PROTECTION_BLOCKED",
            actorUid: effect.actorUid,
            targetUid: targets[0]?.uid,
            actionId: effect.id,
            reasonCode: "TARGET_STATUS_BLOCKS_PROTECTION",
          });
          break;
        }
        effect.targetUids.forEach((targetUid) => protections.set(targetUid, [...(protections.get(targetUid) ?? []), { actionId: effect.id, level: effect.protectionLevel! }]));
        appliedEffects.push(effect);
        break;
      case "investigate": {
        if (!effect.investigationType) {
          failedActions.add(effect.id);
          warnings.push(warning("INVESTIGATION_TYPE_NOT_CONFIGURED", "O tipo de investigação ainda não foi confirmado.", effect.id));
          break;
        }
        const target = targets[0]!;
        const result = target.investigativeAppearance?.[effect.investigationType];
        if (!result) {
          failedActions.add(effect.id);
          warnings.push(warning("INVESTIGATION_MAPPING_NOT_CONFIGURED", "A aparência investigativa do alvo ainda não foi confirmada.", effect.id));
          break;
        }
        investigationResults.push({ actorUid: effect.actorUid, targetUid: target.uid, investigationType: effect.investigationType, result, sourceActionId: effect.id });
        appliedEffects.push(effect);
        events.push({ type: "INVESTIGATION_RESULT", actorUid: effect.actorUid, targetUid: target.uid, actionId: effect.id, reasonCode: "INVESTIGATION_RESOLVED", details: { result } });
        break;
      }
      case "attack":
        attacks.push(effect);
        break;
      case "clean":
        postDeathEffects.push(effect);
        break;
      case "status-effect":
        if (!effect.statusType) {
          failedActions.add(effect.id);
          warnings.push(
            warning(
              "STATUS_TYPE_NOT_CONFIGURED",
              "O status aplicado pela ação não foi configurado.",
              effect.id,
            ),
          );
          break;
        }
        effect.targetUids.forEach((targetUid) => {
          appliedStatuses.push({
            targetUid,
            statusType: effect.statusType!,
            sourceActionId: effect.id,
          });
          events.push({
            type: "STATUS_APPLIED",
            actorUid: effect.actorUid,
            targetUid,
            actionId: effect.id,
            reasonCode: "STATUS_EFFECT_RESOLVED",
            details: { statusType: effect.statusType! },
          });
        });
        appliedEffects.push(effect);
        break;
      case "redirect":
        failedActions.add(effect.id);
        warnings.push(warning("UNSUPPORTED_EFFECT", `O efeito ${effect.effectType} ainda não é suportado.`, effect.id));
        break;
    }
  }

  const successfulAttackTargets = new Set<string>();
  const survivalSources = new Map<string, Set<string>>();
  for (const attack of attacks) {
    if (!attack.attackLevel) {
      failedActions.add(attack.id);
      warnings.push(warning("ATTACK_LEVEL_NOT_CONFIGURED", "O nível do ataque ainda não foi confirmado.", attack.id));
      continue;
    }
    for (const targetUid of attack.targetUids) {
      const target = playersByUid.get(targetUid)!;
      const defenses = [{ actionId: "base-defense", level: target.defense }, ...(protections.get(targetUid) ?? [])];
      let configured = true;
      let stopped = false;
      for (const defense of defenses) {
        const result = resolveAttackAgainstDefense(attack.attackLevel, defense.level, rulesContext.attackDefenseRules);
        if (result.success === null) {
          configured = false;
          warnings.push(warning("ATTACK_DEFENSE_NOT_CONFIGURED", `Interação ${attack.attackLevel}/${defense.level} não configurada.`, attack.id));
        } else if (!result.success) {
          stopped = true;
          const sources = survivalSources.get(targetUid) ?? new Set<string>();
          sources.add(defense.actionId);
          survivalSources.set(targetUid, sources);
          events.push({ type: "PLAYER_SURVIVED", actorUid: attack.actorUid, targetUid, actionId: attack.id, reasonCode: defense.actionId === "base-defense" ? "ATTACK_BLOCKED_BY_DEFENSE" : "TARGET_PROTECTED" });
          break;
        }
      }
      if (configured && !stopped) {
        successfulAttackTargets.add(targetUid);
        appliedEffects.push(attack);
        events.push({ type: "PLAYER_ATTACKED", actorUid: attack.actorUid, targetUid, actionId: attack.id, reasonCode: "ATTACK_SUCCEEDED" });
      } else if (!configured) {
        failedActions.add(attack.id);
      }
    }
  }

  const deaths = [...successfulAttackTargets].sort();
  const cleaned = new Set<string>();
  for (const effect of postDeathEffects) {
    const targetUid = effect.targetUids[0];
    if (targetUid && successfulAttackTargets.has(targetUid)) {
      cleaned.add(targetUid);
      appliedEffects.push(effect);
      events.push({ type: "BODY_CLEANED", actorUid: effect.actorUid, targetUid, actionId: effect.id, reasonCode: "CLEAN_APPLIED_AFTER_DEATH" });
    } else {
      failedActions.add(effect.id);
      events.push({ type: "CLEAN_FAILED", actorUid: effect.actorUid, targetUid, actionId: effect.id, reasonCode: "TARGET_DID_NOT_DIE" });
    }
  }
  deaths.forEach((targetUid) => events.push({ type: "PLAYER_DIED", targetUid, reasonCode: "LETHAL_ATTACK_RESOLVED" }));

  return {
    nightId: gameState.nightId,
    deaths,
    survivors: [...survivalSources.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([targetUid, sources]) => ({ targetUid, reasonCode: "TARGET_SURVIVED_ATTACK", sourceActionIds: [...sources].sort() })),
    investigationResults,
    appliedEffects,
    blockedActions: [...blockedActions].sort(),
    failedActions: [...failedActions].sort(),
    warnings,
    engineEvents: events,
    cleanedPlayerUids: [...cleaned].sort(),
    appliedStatuses,
    partial: warnings.length > 0,
  };
}
