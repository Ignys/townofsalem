"use client";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import { readPublicGame } from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import {
  calculateTimerFieldUpdate,
  InvalidTimerCommandError,
  type TimerCommand,
  type TimerFieldUpdate,
} from "./timer-controls";

export type GameTimerControlErrorCode =
  | "not-host"
  | "game-unavailable"
  | "game-not-in-progress"
  | "invalid-command"
  | "persistence-failed";

export class GameTimerControlError extends Error {
  readonly code: GameTimerControlErrorCode;
  readonly originalError?: unknown;

  constructor(code: GameTimerControlErrorCode, originalError?: unknown) {
    super(`Game timer control failed: ${code}`);
    this.name = "GameTimerControlError";
    this.code = code;
    this.originalError = originalError;
  }
}

export function getGameTimerControlErrorMessage(error: unknown): string {
  if (!(error instanceof GameTimerControlError)) {
    return "Não foi possível atualizar o timer. Tente novamente.";
  }

  switch (error.code) {
    case "not-host":
      return "Somente o mestre autenticado pode controlar o timer.";
    case "game-unavailable":
      return "Não foi possível carregar o timer atual.";
    case "game-not-in-progress":
      return "O timer só pode ser usado durante uma partida em andamento.";
    case "invalid-command":
      return "Esse controle não está disponível no estado atual do timer.";
    case "persistence-failed":
      return "O estado do timer não foi salvo. Tente novamente.";
  }
}

export async function controlGameTimer(
  gameId: string,
  command: TimerCommand,
  serverTimeOffsetMs: number,
): Promise<void> {
  try {
    await requireAuthenticatedGameHost(gameId);
  } catch (error: unknown) {
    throw new GameTimerControlError("not-host", error);
  }

  let game: Awaited<ReturnType<typeof readPublicGame>>;

  try {
    game = await readPublicGame(gameId);
  } catch (error: unknown) {
    throw new GameTimerControlError("game-unavailable", error);
  }

  if (!game) {
    throw new GameTimerControlError("game-unavailable");
  }

  if (
    game.status !== "in-progress" ||
    game.phase === "game-over"
  ) {
    throw new GameTimerControlError("game-not-in-progress");
  }

  let fields: TimerFieldUpdate;

  try {
    fields = calculateTimerFieldUpdate(
      game,
      command,
      Date.now() + serverTimeOffsetMs,
    );
  } catch (error: unknown) {
    if (error instanceof InvalidTimerCommandError) {
      throw new GameTimerControlError("invalid-command", error);
    }

    throw error;
  }

  try {
    await applyAtomicUpdate({
      [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]:
        fields.phaseEndsAt,
      [firebasePaths.gamePublicField(gameId, "timerPaused")]:
        fields.timerPaused,
      [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]:
        fields.timerRemainingMs,
    });
  } catch (error: unknown) {
    throw new GameTimerControlError("persistence-failed", error);
  }
}
