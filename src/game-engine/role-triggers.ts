import type {
  EngineDeath,
  EngineEffect,
  EngineEvent,
  EngineGameState,
  EngineRoleChange,
  EngineWarning,
} from "./types";
import type { GameVariants } from "./variants";

interface RoleTriggerInput {
  gameState: EngineGameState;
  effects: readonly EngineEffect[];
  appliedStatuses: Array<{
    targetUid: string;
    statusType: string;
    sourceActionId: string;
  }>;
  deathRecords: EngineDeath[];
  events: EngineEvent[];
  warnings: EngineWarning[];
  choose: (key: string, candidates: readonly string[]) => string;
  variants: GameVariants;
}

export function resolveRoleTriggers({
  gameState,
  effects,
  appliedStatuses,
  deathRecords,
  events,
  warnings,
  choose,
  variants,
}: RoleTriggerInput): {
  roleChanges: EngineRoleChange[];
  individualWinnerUids: string[];
} {
  const roleChanges: EngineRoleChange[] = [];
  const individualWinnerUids: string[] = [];
  const deadUids = new Set(deathRecords.map(({ targetUid }) => targetUid));

  for (const effect of effects.filter(
    ({ roleId, actionId }) => roleId === "amnesiac" && actionId === "remember-role",
  )) {
    const candidates = gameState.amnesiacRolePool ?? [];
    if (candidates.length === 0) {
      warnings.push({
        code: "AMNESIAC_ROLE_POOL_REQUIRED",
        actionId: effect.id,
        message: "Defina as roles separadas para o Amnesiac antes de resolver a Night 3.",
      });
      continue;
    }
    const rememberedRoleId = choose(`amnesiac-role:${effect.id}`, candidates);
    roleChanges.push({
      playerUid: effect.actorUid,
      fromRoleId: "amnesiac",
      toRoleId: rememberedRoleId,
      reasonCode: "AMNESIAC_REMEMBERED_ROLE",
    });
    events.push({
      type: "AMNESIAC_REMEMBERED_ROLE",
      actorUid: effect.actorUid,
      actionId: effect.id,
      reasonCode: "NIGHT_THREE_RANDOM_ROLE_ASSIGNED",
      details: { rememberedRoleId },
    });
  }

  for (const deadUid of deadUids) {
    const deadPlayer = gameState.players.find(({ uid }) => uid === deadUid);
    const targetStatuses = [
      ...(deadPlayer?.statuses ?? []),
      ...appliedStatuses
        .filter(({ targetUid }) => targetUid === deadUid)
        .map(({ statusType }) => statusType),
    ];
    for (const status of targetStatuses) {
      if (!status.startsWith("execution-target:")) continue;
      const executionerUid = status.slice("execution-target:".length);
      const executioner = gameState.players.find(({ uid }) => uid === executionerUid);
      if (!executioner || executioner.roleId !== "executioner" || deadUids.has(executionerUid)) {
        continue;
      }
      roleChanges.push({
        playerUid: executionerUid,
        fromRoleId: "executioner",
        toRoleId: "jester",
        reasonCode: "EXECUTIONER_TARGET_DIED_AT_NIGHT",
      });
      events.push({
        type: "EXECUTIONER_BECAME_JESTER",
        actorUid: executionerUid,
        targetUid: deadUid,
        reasonCode: "TARGET_DIED_AT_NIGHT",
      });
    }
  }

  const curseApplied = appliedStatuses.some(({ statusType }) => statusType === "cursed");
  if (curseApplied) {
    const witches = gameState.players.filter(
      ({ alive, roleId, uid }) => alive && roleId === "witch" && !deadUids.has(uid),
    );
    for (const witch of witches) {
      const otherLiving = gameState.players.filter(
        ({ alive, uid }) => alive && uid !== witch.uid && !deadUids.has(uid),
      );
      const allCursed = otherLiving.length > 0 && otherLiving.every((player) =>
        player.statuses.includes("cursed")
        || appliedStatuses.some(
          ({ targetUid, statusType }) => targetUid === player.uid && statusType === "cursed",
        ),
      );
      if (!allCursed) continue;

      for (const target of otherLiving) {
        deathRecords.push({
          targetUid: target.uid,
          cause: "witch-curse",
          attackerUid: witch.uid,
          unavoidable: true,
        });
        deadUids.add(target.uid);
      }
      individualWinnerUids.push(witch.uid);
      appliedStatuses.push({
        targetUid: witch.uid,
        statusType: "witch-won",
        sourceActionId: "witch-curse-win",
      });
      events.push({
        type: "WITCH_CURSE_WIN_TRIGGERED",
        actorUid: witch.uid,
        reasonCode: "ALL_OTHER_LIVING_PLAYERS_CURSED",
        details: { killedPlayerUids: otherLiving.map(({ uid }) => uid) },
      });
    }
  }

  if (variants.witchDeathKillsCursedPlayers) {
    const deadWitch = gameState.players.find(
      ({ uid, roleId }) => roleId === "witch" && deadUids.has(uid),
    );
    if (deadWitch) {
      const cursedLiving = gameState.players.filter(
        ({ alive, uid, statuses }) => alive
          && !deadUids.has(uid)
          && (
            statuses.includes("cursed")
            || appliedStatuses.some(
              ({ targetUid, statusType }) => targetUid === uid && statusType === "cursed",
            )
          ),
      );
      for (const target of cursedLiving) {
        deathRecords.push({
          targetUid: target.uid,
          cause: "witch-curse",
          attackerUid: deadWitch.uid,
          unavoidable: true,
        });
        deadUids.add(target.uid);
      }
      events.push({
        type: "WITCH_DEATH_KILLED_CURSED_PLAYERS",
        actorUid: deadWitch.uid,
        reasonCode: "OPTIONAL_VARIANT_TRIGGERED",
        details: { killedPlayerUids: cursedLiving.map(({ uid }) => uid) },
      });
    }
  }

  return { roleChanges, individualWinnerUids };
}
