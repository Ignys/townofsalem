"use client";

import { canTransition } from "@/game-engine/game-phase-machine";
import { readPublicGame } from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import type { GamePhase } from "@/types";

import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export type PhaseTransitionErrorCode =
  | "not-host"
  | "game-unavailable"
  | "game-not-in-progress"
  | "transition-not-allowed"
  | "persistence-failed";

export class PhaseTransitionError extends Error {
  readonly code: PhaseTransitionErrorCode;
  readonly originalError?: unknown;

  constructor(code: PhaseTransitionErrorCode, originalError?: unknown) {
    super(`Phase transition failed: ${code}`);
    this.name = "PhaseTransitionError";
    this.code = code;
    this.originalError = originalError;
  }
}

export interface PhaseChangedEventDraft {
  type: "PHASE_CHANGED";
  timestamp: number;
  payload: {
    from: GamePhase;
    to: GamePhase;
  };
}

export interface PhaseTransitionResult {
  eventDraft: PhaseChangedEventDraft;
}

export function getPhaseTransitionErrorMessage(error: unknown): string {
  if (!(error instanceof PhaseTransitionError)) {
    return "Não foi possível mudar a fase. Tente novamente.";
  }

  switch (error.code) {
    case "not-host":
      return "Somente o mestre autenticado pode mudar a fase.";
    case "game-unavailable":
      return "Não foi possível carregar a fase atual da partida.";
    case "game-not-in-progress":
      return "As fases só podem ser controladas depois do sorteio.";
    case "transition-not-allowed":
      return "Essa transição não é permitida a partir da fase atual.";
    case "persistence-failed":
      return "A nova fase não foi salva. Tente novamente.";
  }
}

export async function transitionGamePhase(
  gameId: string,
  to: GamePhase,
  now: () => number = Date.now,
): Promise<PhaseTransitionResult> {
  try {
    await requireAuthenticatedGameHost(gameId);
  } catch (error: unknown) {
    throw new PhaseTransitionError("not-host", error);
  }

  let game: Awaited<ReturnType<typeof readPublicGame>>;

  try {
    game = await readPublicGame(gameId);
  } catch (error: unknown) {
    throw new PhaseTransitionError("game-unavailable", error);
  }

  if (!game) {
    throw new PhaseTransitionError("game-unavailable");
  }

  if (game.status !== "in-progress") {
    throw new PhaseTransitionError("game-not-in-progress");
  }

  if (!canTransition(game.phase, to)) {
    throw new PhaseTransitionError("transition-not-allowed");
  }

  if (game.phase === "discussion" && to === "trial") {
    throw new PhaseTransitionError("transition-not-allowed");
  }

  if (
    game.phase === "verdict" &&
    !game.verdictClosedAt &&
    to !== "game-over"
  ) {
    throw new PhaseTransitionError("transition-not-allowed");
  }

  const eventDraft: PhaseChangedEventDraft = {
    type: "PHASE_CHANGED",
    timestamp: now(),
    payload: { from: game.phase, to },
  };

  try {
    await applyAtomicUpdate({
      [firebasePaths.gamePublicField(gameId, "phase")]: to,
      [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]: null,
      [firebasePaths.gamePublicField(gameId, "timerPaused")]: false,
      [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]: null,
      ...(to === "game-over"
        ? {
            [firebasePaths.gamePublicField(gameId, "status")]: "finished",
          }
        : {}),
    });
  } catch (error: unknown) {
    throw new PhaseTransitionError("persistence-failed", error);
  }

  return { eventDraft };
}
