"use client";

import {
  readGameGraveyard,
  readGamePlayers,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import {
  applyAtomicUpdate,
  type AtomicUpdateMap,
} from "@/lib/firebase/realtime-database-repository";

import { getMissingGraveyardEntries } from "./graveyard-entry";

/**
 * Buries any player the host already marked dead but who never got a tombstone.
 * Runs from the host console, the only client allowed to read every role.
 */
export async function backfillGraveyard(
  gameId: string,
  now: number = Date.now(),
): Promise<number> {
  const game = await readPublicGame(gameId);
  if (game?.status !== "in-progress") return 0;

  const [players, privatePlayers, graveyard] = await Promise.all([
    readGamePlayers(gameId),
    readHostPrivatePlayers(gameId),
    readGameGraveyard(gameId),
  ]);

  const missing = getMissingGraveyardEntries(players, privatePlayers, graveyard, now);
  const uids = Object.keys(missing);
  if (uids.length === 0) return 0;

  const updates: AtomicUpdateMap = {};
  for (const uid of uids) {
    updates[firebasePaths.gameGraveyardEntry(gameId, uid)] = missing[uid];
  }
  await applyAtomicUpdate(updates);

  return uids.length;
}
