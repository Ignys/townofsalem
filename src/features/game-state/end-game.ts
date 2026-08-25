"use client";

import { readPublicGame } from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export async function endGame(
  gameId: string,
  winners: { factions?: readonly string[]; playerUids?: readonly string[] } = {},
  now: number = Date.now(),
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const game = await readPublicGame(gameId);
  if (!game || game.status !== "in-progress") throw new Error("game-not-in-progress");
  const winningFactions = [...(winners.factions ?? [])];
  const winningPlayerUids = [...(winners.playerUids ?? [])];

  await applyAtomicUpdate({
    [firebasePaths.gamePublicField(gameId, "status")]: "finished",
    [firebasePaths.gamePublicField(gameId, "phase")]: "game-over",
    [firebasePaths.gamePublicField(gameId, "phaseLabel")]: "Fim de jogo",
    [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]: null,
    [firebasePaths.gamePublicField(gameId, "timerPaused")]: false,
    [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]: 0,
    [firebasePaths.gamePublicField(gameId, "winningFactions")]: winningFactions,
    [firebasePaths.gamePublicField(gameId, "winningPlayerUids")]: winningPlayerUids,
    [firebasePaths.gamePublicField(gameId, "gameEndedAt")]: now,
    [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
      type: "GAME_ENDED", timestamp: now, actorUid: hostUid, visibility: "public", payload: { winningFactions, winningPlayerUids },
    },
  });
}
