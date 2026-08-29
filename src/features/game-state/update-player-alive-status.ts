"use client";

import {
  readHostPrivatePlayer,
  readPublicGame,
  readPublicPlayer,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import { buildGraveyardEntry } from "./graveyard-entry";
import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export async function updatePlayerAliveStatus(
  gameId: string,
  playerUid: string,
  alive: boolean,
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const [game, player] = await Promise.all([
    readPublicGame(gameId),
    readPublicPlayer(gameId, playerUid),
  ]);

  if (game?.status !== "in-progress") {
    throw new Error("Player status can only change during a match.");
  }

  if (!player) {
    throw new Error("The player no longer exists in this game.");
  }

  if (player.alive === alive) {
    return;
  }

  const privatePlayer = alive ? null : await readHostPrivatePlayer(gameId, playerUid);

  await applyAtomicUpdate({
    [firebasePaths.gamePlayerField(gameId, playerUid, "alive")]: alive,
    // The tombstone mirrors `alive`: a revived player leaves the graveyard.
    [firebasePaths.gameGraveyardEntry(gameId, playerUid)]: alive
      ? null
      : buildGraveyardEntry(
          privatePlayer?.roleId,
          Boolean(privatePlayer?.statuses?.cleaned),
          Date.now(),
        ),
    [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
      type: alive ? "PLAYER_REVIVED_BY_HOST" : "PLAYER_DIED",
      timestamp: Date.now(),
      actorUid: hostUid,
      visibility: "host-only",
      payload: { playerUid, source: "administrative-override" },
    },
  });
}
