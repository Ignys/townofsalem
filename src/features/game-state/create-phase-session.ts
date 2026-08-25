import type {
  GamePhase,
  NightSession,
  PhaseSession,
  PlayablePhase,
} from "@/types";

export const MAX_PHASE_DURATION_SECONDS = 24 * 60 * 60;

export interface PhaseSessionSnapshot {
  phaseSequenceNumber?: number;
  nightNumber?: number;
}

export interface CreatePhaseSessionInput {
  phaseId: PlayablePhase | "custom";
  label: string;
  durationSeconds: number | null;
  startedAt: number;
  phaseSessionId: string;
  nightId?: string;
}

export interface CreatedPhaseSession {
  phase: GamePhase;
  phaseSession: PhaseSession;
  nightSession?: NightSession;
  phaseEndsAt: number | null;
  nextPhaseSequenceNumber: number;
  nextNightNumber: number;
}

export class InvalidPhaseSessionError extends Error {
  constructor(readonly code: "invalid-duration" | "missing-night-id" | "invalid-label") {
    super(`Cannot create phase session: ${code}`);
    this.name = "InvalidPhaseSessionError";
  }
}

export function createPhaseSession(
  snapshot: PhaseSessionSnapshot,
  input: CreatePhaseSessionInput,
): CreatedPhaseSession {
  const normalizedLabel = input.label.trim();
  const durationSeconds = input.durationSeconds;

  if (!normalizedLabel || normalizedLabel.length > 40) {
    throw new InvalidPhaseSessionError("invalid-label");
  }

  if (
    durationSeconds !== null &&
    (!Number.isInteger(durationSeconds) ||
      durationSeconds <= 0 ||
      durationSeconds > MAX_PHASE_DURATION_SECONDS)
  ) {
    throw new InvalidPhaseSessionError("invalid-duration");
  }

  if (input.phaseId === "night" && !input.nightId) {
    throw new InvalidPhaseSessionError("missing-night-id");
  }

  const nextPhaseSequenceNumber = (snapshot.phaseSequenceNumber ?? 0) + 1;
  const nextNightNumber =
    input.phaseId === "night"
      ? (snapshot.nightNumber ?? 0) + 1
      : (snapshot.nightNumber ?? 0);
  const phaseEndsAt =
    durationSeconds === null
      ? null
      : input.startedAt + durationSeconds * 1_000;
  const phaseSession: PhaseSession = {
    id: input.phaseSessionId,
    phaseId: input.phaseId,
    label: normalizedLabel,
    startedAt: input.startedAt,
    durationSeconds,
    endsAt: phaseEndsAt,
    sequenceNumber: nextPhaseSequenceNumber,
    ...(input.nightId ? { nightId: input.nightId } : {}),
  };

  return {
    phase: input.phaseId,
    phaseSession,
    phaseEndsAt,
    nextPhaseSequenceNumber,
    nextNightNumber,
    ...(input.phaseId === "night" && input.nightId
      ? {
          nightSession: {
            id: input.nightId,
            phaseSessionId: input.phaseSessionId,
            nightNumber: nextNightNumber,
            startedAt: input.startedAt,
          },
        }
      : {}),
  };
}
