"use client";

import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";
import { createEngineGameState } from "@/game-engine/host-action-adapter";
import {
  resolveAssistedDayDeath,
  type AssistedDayDeathInput,
} from "@/game-engine/resolve-day";
import {
  readGamePlayers,
  readGameSettings,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import {
  applyAtomicUpdate,
  type AtomicUpdateMap,
} from "@/lib/firebase/realtime-database-repository";
import type { Player } from "@/types";

import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

/**
 * Applies a day death declared by the host in assisted mode.
 *
 * This is the counterpart of `applyNightResolution`: it is the only way to
 * record that someone was *lynched* rather than merely marked dead, which is
 * what decides whether an Executioner wins or turns into a Jester.
 */
export async function applyDayResolution(
  gameId: string,
  input: AssistedDayDeathInput,
  now: number = Date.now(),
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const game = await readPublicGame(gameId);
  if (game?.status !== "in-progress") {
    throw new Error("day-resolution-requires-a-running-game");
  }
  if (game.phase === "night") {
    throw new Error("day-resolution-requires-a-day-phase");
  }

  const [playerRecords, privatePlayers, settings] = await Promise.all([
    readGamePlayers(gameId),
    readHostPrivatePlayers(gameId),
    readGameSettings(gameId),
  ]);
  if (!playerRecords?.[input.targetUid]?.alive) {
    throw new Error("day-death-player-already-dead");
  }

  const players: Player[] = Object.entries(playerRecords ?? {}).map(([uid, player]) => ({
    id: uid,
    uid,
    ...player,
    statuses: Object.values(privatePlayers?.[uid]?.statuses ?? {}),
  }));
  const assignments = Object.fromEntries(
    Object.entries(privatePlayers ?? {}).map(([uid, player]) => [uid, player.roleId]),
  );
  const state = createEngineGameState({
    gameId,
    nightId: `day-${game.day ?? 0}`,
    nightNumber: game.nightNumber ?? 1,
    players,
    assignments,
    privatePlayerStates: privatePlayers ?? {},
    roleDefinitions: ROLE_DEFINITIONS,
    variants: settings?.gameVariants,
  });

  const resolution = resolveAssistedDayDeath(state, input);
  if (resolution.warnings.length > 0) {
    throw new Error(resolution.warnings[0].code);
  }

  const updates: AtomicUpdateMap = {
    [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
      type: "DAY_RESOLUTION_APPLIED",
      timestamp: now,
      actorUid: hostUid,
      visibility: "host-only",
      payload: {
        accusedPlayerUid: input.targetUid,
        kind: input.kind,
        deaths: resolution.deaths.map(({ targetUid, cause }) => ({ targetUid, cause })),
        individualWinnerUids: [...resolution.individualWinnerUids],
        roleChanges: resolution.roleChanges.map(({ playerUid, fromRoleId, toRoleId, reasonCode }) => ({
          playerUid,
          fromRoleId,
          toRoleId,
          reasonCode,
        })),
      },
    },
  };

  for (const death of resolution.deaths) {
    if (!playerRecords?.[death.targetUid]?.alive) continue;
    updates[firebasePaths.gamePlayerField(gameId, death.targetUid, "alive")] = false;
  }
  for (const status of resolution.appliedStatuses) {
    updates[firebasePaths.gamePrivatePlayerStatus(gameId, status.targetUid, status.statusType)] = {
      type: status.statusType,
    };
  }
  for (const change of resolution.roleChanges) {
    const nextRole = getRoleById(change.toRoleId);
    if (!privatePlayers?.[change.playerUid] || !nextRole) continue;
    updates[firebasePaths.gamePrivatePlayerField(gameId, change.playerUid, "roleId")] = nextRole.id;
    updates[firebasePaths.gamePrivatePlayerField(gameId, change.playerUid, "faction")] = nextRole.faction;
  }
  for (const winnerUid of resolution.individualWinnerUids) {
    const roleId = privatePlayers?.[winnerUid]?.roleId;
    if (!roleId) continue;
    const statusType = `${roleId}-won`;
    updates[firebasePaths.gamePrivatePlayerStatus(gameId, winnerUid, statusType)] = {
      type: statusType,
    };
  }
  if (resolution.gameEnds) {
    updates[firebasePaths.gamePublicField(gameId, "status")] = "finished";
    updates[firebasePaths.gamePublicField(gameId, "phase")] = "game-over";
    updates[firebasePaths.gamePublicField(gameId, "winningPlayerUids")] = [
      ...resolution.individualWinnerUids,
    ];
    updates[firebasePaths.gamePublicField(gameId, "gameEndedAt")] = now;
  }

  await applyAtomicUpdate(updates);
}
