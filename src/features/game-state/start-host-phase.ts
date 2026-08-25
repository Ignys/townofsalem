"use client";

import { readPublicGame } from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import type { PlayablePhase } from "@/types";

import { createPhaseSession } from "./create-phase-session";
import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export interface StartHostPhaseInput {
  phaseId: PlayablePhase | "custom";
  label: string;
  durationSeconds: number | null;
}

export async function startHostPhase(
  gameId: string,
  input: StartHostPhaseInput,
  now: () => number = Date.now,
  createId: () => string = () => crypto.randomUUID(),
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const game = await readPublicGame(gameId);

  if (!game || game.status !== "in-progress") {
    throw new Error("game-not-in-progress");
  }

  const startedAt = now();
  const phaseSessionId = createId();
  const nightId = input.phaseId === "night" ? createId() : undefined;
  const eventId = createId();
  const created = createPhaseSession(game, {
    ...input,
    startedAt,
    phaseSessionId,
    nightId,
  });

  await applyAtomicUpdate({
    [firebasePaths.gamePublicField(gameId, "phase")]: created.phase,
    [firebasePaths.gamePublicField(gameId, "phaseLabel")]: created.phaseSession.label,
    [firebasePaths.gamePublicField(gameId, "phaseSessionId")]: phaseSessionId,
    [firebasePaths.gamePublicField(gameId, "currentNightId")]: nightId ?? null,
    [firebasePaths.gamePublicField(gameId, "phaseSequenceNumber")]: created.nextPhaseSequenceNumber,
    [firebasePaths.gamePublicField(gameId, "nightNumber")]: created.nextNightNumber,
    [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]: created.phaseEndsAt,
    [firebasePaths.gamePublicField(gameId, "timerPaused")]: false,
    [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]: null,
    [firebasePaths.gamePhaseSession(gameId, phaseSessionId)]: created.phaseSession,
    ...(created.nightSession
      ? { [firebasePaths.gameNightSession(gameId, created.nightSession.id)]: created.nightSession }
      : {}),
    [firebasePaths.gameEvent(gameId, eventId)]: {
      type: "PHASE_STARTED",
      timestamp: startedAt,
      actorUid: hostUid,
      visibility: "host-only",
      payload: {
        phaseId: created.phase,
        phaseSessionId,
        nightId: nightId ?? null,
        durationSeconds: input.durationSeconds,
      },
    },
  });
}
