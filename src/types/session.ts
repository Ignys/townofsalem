import type { GamePhase } from "./game";

export interface PhaseSession {
  id: string;
  phaseId: GamePhase;
  label: string;
  startedAt: number;
  durationSeconds: number | null;
  endsAt: number | null;
  sequenceNumber: number;
  nightId?: string;
}

export interface NightSession {
  id: string;
  phaseSessionId: string;
  nightNumber: number;
  startedAt: number;
  endedAt?: number | null;
  resolutionId?: string | null;
  resolutionAppliedAt?: number | null;
  rolledBackAt?: number | null;
  wakeChecklist?: Record<string, import("./night").WakeChecklistState>;
  actionsRevision?: number;
  resolutionApplyingId?: string | null;
  resolutionApplyingAt?: number | null;
  pendingActionWrites?: Record<string, true>;
}
