import { deriveTimerState, type TimerSnapshot } from "./timer-state";

export type TimerCommand =
  | { type: "start"; durationMs: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "add-thirty-seconds" }
  | { type: "end" };

export interface TimerFieldUpdate {
  phaseEndsAt: number | null;
  timerPaused: boolean;
  timerRemainingMs: number | null;
}

export class InvalidTimerCommandError extends Error {
  constructor() {
    super("The timer command is not valid for its current state.");
    this.name = "InvalidTimerCommandError";
  }
}

export function calculateTimerFieldUpdate(
  snapshot: TimerSnapshot,
  command: TimerCommand,
  serverAdjustedNow: number,
): TimerFieldUpdate {
  const current = deriveTimerState(snapshot, serverAdjustedNow);

  switch (command.type) {
    case "start": {
      if (
        (current.status !== "idle" && current.status !== "expired") ||
        !Number.isFinite(command.durationMs) ||
        command.durationMs <= 0 ||
        !Number.isFinite(serverAdjustedNow + command.durationMs)
      ) {
        throw new InvalidTimerCommandError();
      }

      return {
        phaseEndsAt: serverAdjustedNow + Math.round(command.durationMs),
        timerPaused: false,
        timerRemainingMs: null,
      };
    }
    case "pause": {
      if (current.status !== "running") {
        throw new InvalidTimerCommandError();
      }

      return {
        phaseEndsAt: null,
        timerPaused: true,
        timerRemainingMs: current.remainingMs,
      };
    }
    case "resume": {
      if (current.status !== "paused" || current.remainingMs <= 0) {
        throw new InvalidTimerCommandError();
      }

      return {
        phaseEndsAt: serverAdjustedNow + current.remainingMs,
        timerPaused: false,
        timerRemainingMs: null,
      };
    }
    case "add-thirty-seconds": {
      if (current.status === "running") {
        return {
          phaseEndsAt:
            Math.max(snapshot.phaseEndsAt ?? 0, serverAdjustedNow) + 30_000,
          timerPaused: false,
          timerRemainingMs: null,
        };
      }

      if (current.status === "paused") {
        return {
          phaseEndsAt: null,
          timerPaused: true,
          timerRemainingMs: current.remainingMs + 30_000,
        };
      }

      throw new InvalidTimerCommandError();
    }
    case "end": {
      if (current.status !== "running" && current.status !== "paused") {
        throw new InvalidTimerCommandError();
      }

      return {
        phaseEndsAt: null,
        timerPaused: false,
        timerRemainingMs: 0,
      };
    }
  }
}
