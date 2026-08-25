export type TimerStatus = "idle" | "running" | "paused" | "expired";

export interface TimerSnapshot {
  phaseEndsAt?: number | null;
  timerPaused?: boolean;
  timerRemainingMs?: number | null;
}

export interface SynchronizedTimerState {
  status: TimerStatus;
  remainingMs: number;
}

export function deriveTimerState(
  snapshot: TimerSnapshot,
  serverAdjustedNow: number,
): SynchronizedTimerState {
  if (snapshot.timerPaused) {
    return {
      status: "paused",
      remainingMs: Math.max(0, snapshot.timerRemainingMs ?? 0),
    };
  }

  if (typeof snapshot.phaseEndsAt === "number") {
    const remainingMs = Math.max(0, snapshot.phaseEndsAt - serverAdjustedNow);

    return {
      status: remainingMs > 0 ? "running" : "expired",
      remainingMs,
    };
  }

  if (snapshot.timerRemainingMs === 0) {
    return { status: "expired", remainingMs: 0 };
  }

  return { status: "idle", remainingMs: 0 };
}

export function formatTimerRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
