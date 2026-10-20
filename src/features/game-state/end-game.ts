"use client";

import { createId } from "@/lib/utils/create-id";
import {
  readGamePlayers,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import {
  createEndGameUpdates,
  getFinalRoles,
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

  if (!game || (game.status !== "in-progress" && game.status !== "finished")) throw new Error("game-not-running");

  // Encerrar no meio do jogo mostra o resultado (sem vencedor) e as roles; a volta ao lobby
  // fica para "Nova partida", que chama esta função de novo com a partida já encerrada.
  if (game.status === "in-progress") {
    const privatePlayers = await readHostPrivatePlayers(gameId);
    await applyAtomicUpdate({
      [firebasePaths.gamePublicField(gameId, "status")]: "finished",
      [firebasePaths.gamePublicField(gameId, "phase")]: "game-over",
      [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]: null,
      [firebasePaths.gamePublicField(gameId, "timerPaused")]: false,
      [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]: null,
      [firebasePaths.gamePublicField(gameId, "winningFactions")]: [...(winners.factions ?? [])],
      [firebasePaths.gamePublicField(gameId, "winningPlayerUids")]: [...(winners.playerUids ?? [])],
      [firebasePaths.gamePublicField(gameId, "gameEndedAt")]: now,
      [firebasePaths.gamePublicField(gameId, "finalRoles")]: getFinalRoles(privatePlayers),
      [firebasePaths.gameEvent(gameId, createId())]: {
        type: "GAME_ENDED",
        timestamp: now,
        actorUid: hostUid,
        visibility: "public",
        payload: { endedByHost: true, returnedToLobby: false },
      },
    });
    return;
  }

  await applyAtomicUpdate(
    createEndGameUpdates({
      gameId,
      hostUid,
      playerUids: Object.keys(players ?? {}),
      winners,
      endedAt: now,
      eventId: createId(),
    }),
  );
}
