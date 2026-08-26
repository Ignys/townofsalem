"use client";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import { readPublicPlayer } from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

export async function kickPlayerFromGame(
  gameId: string,
  playerUid: string,
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const player = await readPublicPlayer(gameId, playerUid);

  if (!player) {
    return;
  }

  await applyAtomicUpdate({
    [firebasePaths.gamePlayer(gameId, playerUid)]: null,
    [firebasePaths.gamePrivatePlayer(gameId, playerUid)]: null,
    [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
      type: "PLAYER_KICKED_BY_HOST",
      timestamp: Date.now(),
      actorUid: hostUid,
      visibility: "host-only",
      payload: { playerUid, playerName: player.name },
    },
  });
}
