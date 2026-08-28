import { getRoleResourceLimit } from "./role-resource-limits";
import type {
  EngineDeath,
  EngineEffect,
  EngineEvent,
  EngineGameState,
  EngineSurvival,
} from "./types";
import type { GameVariants } from "./variants";
import type { EngineVisit } from "./visits";

type AttackKind =
  | "normal"
  | "mafia"
  | "veteran"
  | "bodyguard-counterattack";

interface AttackAttempt {
  id: string;
  sourceActionId: string;
  attackerUid?: string;
  originalTargetUid?: string;
  targetUid: string;
  kind: AttackKind;
  participantUids: readonly string[];
}

interface CombatInput {
  gameState: EngineGameState;
  effects: readonly EngineEffect[];
  visits: readonly EngineVisit[];
  variants: GameVariants;
  choose: (key: string, candidates: readonly string[]) => string;
}

export interface CombatResult {
  deathRecords: EngineDeath[];
  survivors: EngineSurvival[];
  events: EngineEvent[];
  cleanedPlayerUids: string[];
  consumedResources: Array<{
    playerUid: string;
    resource: string;
    amount: number;
  }>;
}

function attackKind(effect: EngineEffect): AttackKind {
  if (effect.actionId === "mafia-attack" || effect.sourceFaction === "mafia") {
    return "mafia";
  }
  return "normal";
}

function createBaseAttacks(effects: readonly EngineEffect[]): AttackAttempt[] {
  return effects
    .filter(({ effectType }) => effectType === "attack")
    .flatMap((effect) =>
      effect.targetUids.map((targetUid) => ({
        id: `${effect.id}:${targetUid}`,
        sourceActionId: effect.id,
        ...(effect.sourceType === "faction" ? {} : { attackerUid: effect.actorUid }),
        targetUid,
        kind: attackKind(effect),
        participantUids: effect.participantUids ?? [effect.actorUid],
      })),
    );
}

function isNightImmune(
  targetRoleId: string,
  targetUid: string,
  alertVeterans: ReadonlySet<string>,
  nightNumber: number,
  variants: GameVariants,
): boolean {
  if (targetRoleId === "serial-killer" || targetRoleId === "survivor") return true;
  if (alertVeterans.has(targetUid)) return true;
  return targetRoleId === "werewolf"
    && variants.werewolfImmuneDuringFullMoon
    && nightNumber >= 2
    && nightNumber % 2 === 0;
}

function toDeathCause(kind: AttackKind): EngineDeath["cause"] {
  if (kind === "mafia") return "mafia-attack";
  if (kind === "veteran") return "veteran-attack";
  if (kind === "bodyguard-counterattack") return "bodyguard-counterattack";
  return "night-attack";
}

export function resolveCombat({
  gameState,
  effects,
  visits,
  variants,
  choose,
}: CombatInput): CombatResult {
  const playersByUid = new Map(gameState.players.map((player) => [player.uid, player]));
  const events: EngineEvent[] = [];
  const deathRecords: EngineDeath[] = [];
  const survivalSources = new Map<string, Set<string>>();
  const addSurvivalSources = (targetUid: string, sourceActionIds: readonly string[]) => {
    const sources = survivalSources.get(targetUid) ?? new Set<string>();
    sourceActionIds.forEach((sourceActionId) => sources.add(sourceActionId));
    survivalSources.set(targetUid, sources);
  };
  const attempts = createBaseAttacks(effects);
  const interceptedAttemptIds = new Set<string>();
  const alertVeterans = new Set(
    effects
      .filter((effect) => effect.roleId === "veteran" && effect.actionId === "alert")
      .map((effect) => effect.actorUid),
  );

  const veteranVisitKeys = new Set<string>();
  const veteranVisitorsAttacked = new Set<string>();
  for (const visit of visits) {
    if (!alertVeterans.has(visit.targetUid)) continue;
    const visitKey = `${visit.sourceActionId}:${visit.targetUid}`;
    if (veteranVisitKeys.has(visitKey)) continue;
    veteranVisitKeys.add(visitKey);

    let visitorUid = visit.visitorUid;
    if (!visitorUid && visit.sourceFaction === "mafia") {
      visitorUid = choose(
        `veteran-mafia-representative:${visitKey}`,
        visit.participantUids.filter((uid) => playersByUid.get(uid)?.alive),
      );
      events.push({
        type: "MAFIA_MEMBER_RANDOMLY_SELECTED",
        actorUid: visit.targetUid,
        targetUid: visitorUid,
        actionId: visit.sourceActionId,
        reasonCode: "VETERAN_MAFIA_VISITOR_SELECTED",
        details: { participantUids: visit.participantUids },
      });
    }
    if (!visitorUid) continue;

    const visitorAttackKey = `${visit.targetUid}:${visitorUid}`;
    if (veteranVisitorsAttacked.has(visitorAttackKey)) continue;
    veteranVisitorsAttacked.add(visitorAttackKey);

    attempts.push({
      id: `veteran:${visit.targetUid}:${visit.sourceActionId}:${visitorUid}`,
      sourceActionId: `veteran-alert:${visit.targetUid}`,
      attackerUid: visit.targetUid,
      targetUid: visitorUid,
      kind: "veteran",
      participantUids: [visit.targetUid],
    });
    events.push({
      type: "VETERAN_VISITOR_ATTACKED",
      actorUid: visit.targetUid,
      targetUid: visitorUid,
      actionId: visit.sourceActionId,
      reasonCode: "VISITOR_ENTERED_ALERT",
    });
  }

  const doctorEffects = effects.filter(
    (effect) => effect.effectType === "protect"
      && effect.targetUids.length > 0
      && effect.protectionType !== "bodyguard"
      && effect.roleId !== "bodyguard",
  );
  const doctorSourcesByTarget = new Map<string, string[]>();
  for (const effect of doctorEffects) {
    for (const targetUid of effect.targetUids) {
      const target = playersByUid.get(targetUid);
      if (!target || target.statuses.includes("mayor-revealed")) continue;
      doctorSourcesByTarget.set(targetUid, [
        ...(doctorSourcesByTarget.get(targetUid) ?? []),
        effect.id,
      ]);
    }
  }

  const bodyguardEffects = effects
    .filter(
      (effect) => effect.effectType === "protect"
        && (effect.protectionType === "bodyguard" || effect.roleId === "bodyguard"),
    )
    .sort((left, right) => left.id.localeCompare(right.id));

  for (const guard of bodyguardEffects) {
    const protectedUid = guard.targetUids[0];
    if (!protectedUid) continue;
    const candidates = attempts.filter(
      (attempt) => attempt.targetUid === protectedUid
        && !interceptedAttemptIds.has(attempt.id),
    );
    if (candidates.length === 0) continue;

    const interceptedId = candidates.length === 1
      ? candidates[0].id
      : choose(
        `bodyguard-intercept:${guard.id}`,
        candidates.map(({ id }) => id),
      );
    const intercepted = candidates.find(({ id }) => id === interceptedId)!;
    interceptedAttemptIds.add(intercepted.id);
    addSurvivalSources(protectedUid, [guard.id]);
    events.push({
      type: "BODYGUARD_INTERCEPTED_ATTACK",
      actorUid: guard.actorUid,
      targetUid: protectedUid,
      actionId: guard.id,
      reasonCode: "ONE_ATTACK_INTERCEPTED",
      details: { interceptedActionId: intercepted.sourceActionId },
    });

    let counterTargetUid = intercepted.attackerUid;
    if (intercepted.kind === "mafia") {
      const eligible = intercepted.participantUids.filter(
        (uid) => playersByUid.get(uid)?.alive,
      );
      counterTargetUid = eligible.length > 0
        ? choose(`bodyguard-mafia-counterattack:${guard.id}`, eligible)
        : undefined;
      if (counterTargetUid) {
        events.push({
          type: "MAFIA_MEMBER_RANDOMLY_SELECTED",
          actorUid: guard.actorUid,
          targetUid: counterTargetUid,
          actionId: guard.id,
          reasonCode: "BODYGUARD_MAFIA_TARGET_SELECTED",
          details: { participantUids: eligible },
        });
      }
    }

    const sacrificeCanBeHealed = !variants.doctorCannotSaveBodyguardSacrifice
      && (doctorSourcesByTarget.get(guard.actorUid)?.length ?? 0) > 0;
    if (sacrificeCanBeHealed) {
      addSurvivalSources(
        guard.actorUid,
        doctorSourcesByTarget.get(guard.actorUid) ?? [],
      );
      events.push({
        type: "DOCTOR_PREVENTED_DEATH",
        targetUid: guard.actorUid,
        actionId: guard.id,
        reasonCode: "BODYGUARD_SACRIFICE_HEALED_BY_VARIANT",
      });
    } else {
      deathRecords.push({
        targetUid: guard.actorUid,
        cause: "bodyguard-sacrifice",
        sourceActionId: guard.id,
        originalTargetUid: protectedUid,
        originalAttackCause: toDeathCause(intercepted.kind),
        ...(counterTargetUid
          ? { attackerUid: counterTargetUid }
          : {}),
        unavoidable: variants.doctorCannotSaveBodyguardSacrifice,
      });
      events.push({
        type: "BODYGUARD_SACRIFICED",
        actorUid: guard.actorUid,
        targetUid: protectedUid,
        actionId: guard.id,
        reasonCode: "BODYGUARD_SACRIFICE_IS_SPECIAL_DEATH",
      });
    }

    if (counterTargetUid) {
      attempts.push({
        id: `bodyguard-counter:${guard.id}:${counterTargetUid}`,
        sourceActionId: guard.id,
        attackerUid: guard.actorUid,
        originalTargetUid: protectedUid,
        targetUid: counterTargetUid,
        kind: "bodyguard-counterattack",
        participantUids: [guard.actorUid],
      });
      events.push({
        type: "BODYGUARD_COUNTERATTACK",
        actorUid: guard.actorUid,
        targetUid: counterTargetUid,
        actionId: guard.id,
        reasonCode: "BODYGUARD_RETALIATED",
      });
    }
  }

  const attemptsByTarget = new Map<string, AttackAttempt[]>();
  const successfulMafiaVictims: string[] = [];
  for (const attempt of attempts) {
    if (interceptedAttemptIds.has(attempt.id)) continue;
    attemptsByTarget.set(attempt.targetUid, [
      ...(attemptsByTarget.get(attempt.targetUid) ?? []),
      attempt,
    ]);
  }

  for (const [targetUid, targetAttempts] of attemptsByTarget) {
    const target = playersByUid.get(targetUid);
    if (!target) continue;
    if (!target.canDieAtNight || isNightImmune(
      target.roleId,
      targetUid,
      alertVeterans,
      gameState.nightNumber ?? 1,
      variants,
    )) {
      addSurvivalSources(targetUid, []);
      for (const attempt of targetAttempts) {
        events.push({
          type: "NIGHT_IMMUNITY_PREVENTED_DEATH",
          ...(attempt.attackerUid ? { actorUid: attempt.attackerUid } : {}),
          targetUid,
          actionId: attempt.sourceActionId,
          reasonCode: alertVeterans.has(targetUid)
            ? "VETERAN_ALERT_IMMUNITY"
            : !target.canDieAtNight && !["serial-killer", "survivor"].includes(target.roleId)
              ? "TARGET_CANNOT_DIE_AT_NIGHT"
              : "INTRINSIC_NIGHT_IMMUNITY",
        });
      }
      continue;
    }

    const doctorSources = doctorSourcesByTarget.get(targetUid) ?? [];
    if (doctorSources.length > 0) {
      addSurvivalSources(targetUid, doctorSources);
      events.push({
        type: "DOCTOR_PREVENTED_DEATH",
        targetUid,
        actionId: doctorSources[0],
        reasonCode: "ALL_NORMAL_NIGHT_ATTACKS_HEALED",
        details: { attackActionIds: targetAttempts.map(({ sourceActionId }) => sourceActionId) },
      });
      continue;
    }

    const first = targetAttempts.find(({ kind }) => kind === "mafia")
      ?? targetAttempts[0];
    if (targetAttempts.some(({ kind }) => kind === "mafia")) {
      successfulMafiaVictims.push(targetUid);
    }
    let attackerUid = first.attackerUid;
    if (!attackerUid && first.kind === "mafia") {
      const eligible = first.participantUids.filter(
        (uid) => playersByUid.get(uid)?.alive,
      );
      attackerUid = eligible.length > 0
        ? choose(`mafia-attack-representative:${first.id}`, eligible)
        : undefined;
      if (attackerUid) {
        first.attackerUid = attackerUid;
        events.push({
          type: "MAFIA_MEMBER_RANDOMLY_SELECTED",
          actorUid: attackerUid,
          targetUid,
          actionId: first.sourceActionId,
          reasonCode: "MAFIA_ATTACK_REPRESENTATIVE_SELECTED",
          details: { participantUids: eligible },
        });
      }
    }
    deathRecords.push({
      targetUid,
      cause: toDeathCause(first.kind),
      sourceActionId: first.sourceActionId,
      ...(attackerUid ? { attackerUid } : {}),
      ...(first.originalTargetUid
        ? { originalTargetUid: first.originalTargetUid }
        : {}),
    });
    for (const attempt of targetAttempts) {
      events.push({
        type: "PLAYER_ATTACKED",
        ...(attempt.attackerUid ? { actorUid: attempt.attackerUid } : {}),
        targetUid,
        actionId: attempt.sourceActionId,
        reasonCode: "KILL_SUCCEEDED",
      });
    }
  }

  const cleanedPlayerUids: string[] = [];
  const consumedResources: CombatResult["consumedResources"] = [];
  const janitor = gameState.players.find(
    (player) => player.alive && player.roleId === "janitor",
  );
  if (janitor) {
    const alreadyUsed = gameState.resourceUses?.[`${janitor.uid}:janitor`] ?? 0;
    const remaining = Math.max(
      0,
      (getRoleResourceLimit("janitor", gameState.players.length) ?? 0) - alreadyUsed,
    );
    const mafiaVictims = successfulMafiaVictims.slice(0, remaining);
    for (const targetUid of mafiaVictims) {
      cleanedPlayerUids.push(targetUid);
      consumedResources.push({ playerUid: janitor.uid, resource: "janitor", amount: 1 });
      events.push({
        type: "JANITOR_CLEANED_MAFIA_VICTIM",
        actorUid: janitor.uid,
        targetUid,
        reasonCode: "FIRST_SUCCESSFUL_MAFIA_DEATH_CLEANED",
      });
    }
  }

  return {
    deathRecords,
    survivors: [...survivalSources.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([targetUid, sources]) => ({
        targetUid,
        reasonCode: "TARGET_SURVIVED_ATTACK",
        sourceActionIds: [...sources].sort(),
      })),
    events,
    cleanedPlayerUids,
    consumedResources,
  };
}
