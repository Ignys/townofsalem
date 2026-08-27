"use client";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { createEngineGameState } from "@/game-engine/host-action-adapter";
import { resolveHanging } from "@/game-engine/resolve-day";
import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import {
  readGameDayVotes,
  readGamePlayers,
  readGameSettings,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate, type AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";
import type { Player } from "@/types";
import { getEffectiveVerdicts } from "./voter-rules";

export async function applyHangingResolution(
  gameId: string,
  jesterRevengeTargetUid?: string,
  now: number = Date.now(),
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const game = await readPublicGame(gameId);
  if (
    !game
    || game.status !== "in-progress"
    || game.verdictOutcome !== "guilty"
    || !game.verdictClosedAt
    || !game.accusedPlayerUid
  ) {
    throw new Error("guilty-verdict-required");
  }

  const [playerRecords, privatePlayers, votes, settings] = await Promise.all([
    readGamePlayers(gameId),
    readHostPrivatePlayers(gameId),
    readGameDayVotes(gameId, game.day),
    readGameSettings(gameId),
  ]);
  const accused = playerRecords?.[game.accusedPlayerUid];
  if (!accused?.alive || !privatePlayers?.[game.accusedPlayerUid]) {
    throw new Error("hanging-already-applied");
  }

  const players: Player[] = Object.entries(playerRecords ?? {}).map(([uid, player]) => ({
    id: uid,
    uid,
    ...player,
  }));
  const assignments = Object.fromEntries(
    Object.entries(privatePlayers ?? {}).map(([uid, player]) => [uid, player.roleId]),
  );
  const state = createEngineGameState({
    gameId,
    nightId: `day-${game.day}`,
    nightNumber: game.nightNumber,
    players,
    assignments,
    privatePlayerStates: privatePlayers ?? {},
    roleDefinitions: ROLE_DEFINITIONS,
    variants: settings?.gameVariants,
  });
  const resolution = resolveHanging(
    state,
    game.accusedPlayerUid,
    getEffectiveVerdicts(votes?.verdicts, privatePlayers ?? {}),
    jesterRevengeTargetUid,
  );
  if (resolution.warnings.some(({ code }) => code === "JESTER_REVENGE_TARGET_REQUIRED")) {
    throw new Error("jester-revenge-target-required");
  }
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
        accusedPlayerUid: game.accusedPlayerUid,
        deaths: resolution.deaths.map(({ targetUid, cause }) => ({ targetUid, cause })),
        individualWinnerUids: [...resolution.individualWinnerUids],
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
    updates[firebasePaths.gamePublicField(gameId, "winningPlayerUids")] = [...resolution.individualWinnerUids];
    updates[firebasePaths.gamePublicField(gameId, "gameEndedAt")] = now;
  }
  await applyAtomicUpdate(updates);
}
