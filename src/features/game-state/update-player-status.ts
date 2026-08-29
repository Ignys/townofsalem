"use client";

import {
  readGraveyardEntry,
  readHostPrivatePlayer,
  readPublicGame,
  readPublicPlayer,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import { buildGraveyardEntry } from "./graveyard-entry";
import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export async function updatePlayerStatus(
  gameId: string,
  playerUid: string,
  statusId: "cleaned" | "mayor-revealed",
  active: boolean,
  now: number = Date.now(),
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const [game, player] = await Promise.all([readPublicGame(gameId), readPublicPlayer(gameId, playerUid)]);
  if (!game || game.status !== "in-progress" || !player) throw new Error("player-status-unavailable");
  // Cleaning or un-cleaning a corpse the host already buried has to rewrite the
  // public tombstone, otherwise the role stays revealed after the fact.
  const graveyardEntry =
    statusId === "cleaned" && !player.alive ? await readGraveyardEntry(gameId, playerUid) : null;
  const privatePlayer =
    graveyardEntry && !active ? await readHostPrivatePlayer(gameId, playerUid) : null;

  await applyAtomicUpdate({
    [firebasePaths.gamePrivatePlayerStatus(gameId, playerUid, statusId)]: active ? { type: statusId } : null,
    ...(graveyardEntry
      ? {
          [firebasePaths.gameGraveyardEntry(gameId, playerUid)]: buildGraveyardEntry(
            active ? undefined : privatePlayer?.roleId,
            active,
            graveyardEntry.diedAt,
          ),
        }
      : {}),
    [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
      type: "PLAYER_STATUS_CHANGED", timestamp: now, actorUid: hostUid, visibility: "host-only", payload: { playerUid, statusId, active, source: "administrative-override" },
    },
  });
}
