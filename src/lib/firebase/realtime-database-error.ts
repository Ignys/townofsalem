export type RealtimeDatabaseOperation =
  | "get-reference"
  | "observe-public-game"
  | "observe-game-settings"
  | "observe-players"
  | "observe-private-player"
  | "observe-host-private-players"
  | "observe-host-day-votes"
  | "observe-host-night-actions"
  | "observe-host-notes"
  | "observe-host-night-session"
  | "observe-host-events"
  | "observe-host-night-sessions"
  | "observe-host-night-resolutions"
  | "observe-host-all-night-actions"
  | "observe-accusation-vote"
  | "observe-verdict-vote"
  | "read-room-code"
  | "read-public-game"
  | "read-game-host"
  | "read-game-settings"
  | "read-game-players"
  | "read-public-player"
  | "read-day-votes"
  | "read-night-session"
  | "read-night-resolution"
  | "read-host-private-players"
  | "read-host-private-player"
  | "read-graveyard-entry"
  | "observe-graveyard"
  | "observe-public-player"
  | "write-public-player"
  | "track-player-connection"
  | "observe-firebase-connection"
  | "observe-server-time-offset"
  | "reserve-room-code"
  | "release-room-code"
  | "atomic-update";

export class RealtimeDatabaseRepositoryError extends Error {
  readonly operation: RealtimeDatabaseOperation;
  readonly path: string;
  readonly originalError: unknown;

  constructor(
    operation: RealtimeDatabaseOperation,
    path: string,
    originalError: unknown,
  ) {
    const detail =
      originalError instanceof Error
        ? originalError.message
        : "Unknown Realtime Database error.";

    super(`Realtime Database ${operation} failed at "${path}": ${detail}`);

    this.name = "RealtimeDatabaseRepositoryError";
    this.operation = operation;
    this.path = path;
    this.originalError = originalError;
  }
}

export function toRealtimeDatabaseError(
  operation: RealtimeDatabaseOperation,
  path: string,
  error: unknown,
): RealtimeDatabaseRepositoryError {
  if (error instanceof RealtimeDatabaseRepositoryError) {
    return error;
  }

  return new RealtimeDatabaseRepositoryError(operation, path, error);
}
