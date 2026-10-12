"use client";

import { readPublicGame } from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export interface DeclaredWinners {
  winningFactions: readonly string[];
  winningPlayerUids: readonly string[];
}

/**
 * Encerra a partida com o vencedor que o motor encontrou. Diferente de `endGame`, não volta
 * ao lobby: todo mundo vê o resultado até alguém começar uma nova partida.
 */
export async function declareWinner(
  gameId: string,
  winners: DeclaredWinners,
  now: number = Date.now(),
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const game = await readPublicGame(gameId);
  if (game?.status !== "in-progress") return;

  await applyAtomicUpdate({
    [firebasePaths.gamePublicField(gameId, "status")]: "finished",
    [firebasePaths.gamePublicField(gameId, "phase")]: "game-over",
    [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]: null,
    [firebasePaths.gamePublicField(gameId, "timerPaused")]: false,
    [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]: null,
    [firebasePaths.gamePublicField(gameId, "winningFactions")]: [...winners.winningFactions],
    [firebasePaths.gamePublicField(gameId, "winningPlayerUids")]: [...winners.winningPlayerUids],
    [firebasePaths.gamePublicField(gameId, "gameEndedAt")]: now,
    [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
      type: "GAME_WON",
      timestamp: now,
      actorUid: hostUid,
      visibility: "public",
      payload: {
        winningFactions: [...winners.winningFactions],
        winningPlayerUids: [...winners.winningPlayerUids],
      },
    },
  });
}
