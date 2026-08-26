"use client";

import {
  readGamePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import {
  createEndGameUpdates,
  type EndGameWinners,
} from "./end-game-updates";
import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export async function endGame(
  gameId: string,
  winners: EndGameWinners = {},
  now: number = Date.now(),
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const [game, players] = await Promise.all([
    readPublicGame(gameId),
    readGamePlayers(gameId),
  ]);

  if (!game || game.status !== "in-progress") throw new Error("game-not-in-progress");

  await applyAtomicUpdate(
    createEndGameUpdates({
      gameId,
      hostUid,
      playerUids: Object.keys(players ?? {}),
      winners,
      endedAt: now,
      eventId: crypto.randomUUID(),
    }),
  );
}
