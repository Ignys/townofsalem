"use client";

import {
  onValue,
  update,
  type DataSnapshot,
  type Unsubscribe,
} from "firebase/database";

import type {
  HostNightActionEntry,
  HostNightNote,
  NightSession,
  NightResolutionRecord,
  PhaseSession,
  PlayerStatus,
  WakeChecklistState,
} from "@/types";

import { firebaseAuth } from "./auth";
import { firebasePaths, type FirebasePath } from "./paths";
import {
  RealtimeDatabaseRepositoryError,
  toRealtimeDatabaseError,
  type RealtimeDatabaseOperation,
} from "./realtime-database-error";
import {
  getDatabaseReference,
  getDatabaseRootReference,
} from "./references";
import type {
  FirebaseJsonValue,
  DayVotesRecord,
  GameRecord,
  GamePublicRecord,
  GameSettingsRecord,
  NightActionRecord,
  PrivatePlayerRecord,
  PublicPlayerRecord,
  RoomCodeRecord,
  StoredGameEvent,
  VerdictVote,
} from "./schema";
import type { GameVariants } from "@/game-engine/variants";

export interface RealtimeValueObserver<Value> {
  onData: (value: Value | null) => void;
  onError: (error: RealtimeDatabaseRepositoryError) => void;
}

export type AtomicUpdateValue =
  | FirebaseJsonValue
  | GameRecord
  | GamePublicRecord
  | GameSettingsRecord
  | PublicPlayerRecord
  | PrivatePlayerRecord
  | RoomCodeRecord
  | NightActionRecord
  | DayVotesRecord
  | StoredGameEvent
  | PhaseSession
  | NightSession
  | HostNightActionEntry
  | HostNightNote
  | WakeChecklistState
  | NightResolutionRecord
  | PlayerStatus
  | GameVariants;

export type AtomicUpdateMap = Partial<Record<FirebasePath, AtomicUpdateValue>>;

function snapshotValue<Value>(snapshot: DataSnapshot): Value | null {
  return snapshot.exists() ? (snapshot.val() as Value) : null;
}

function observePath<Value>(
  operation: RealtimeDatabaseOperation,
  path: FirebasePath,
  observer: RealtimeValueObserver<Value>,
): Unsubscribe {
  try {
    return onValue(
      getDatabaseReference(path),
      (snapshot) => observer.onData(snapshotValue<Value>(snapshot)),
      (error) =>
        observer.onError(toRealtimeDatabaseError(operation, path, error)),
    );
  } catch (error: unknown) {
    observer.onError(
      new RealtimeDatabaseRepositoryError(operation, path, error),
    );
    return () => undefined;
  }
}

export function observePublicGame(
  gameId: string,
  observer: RealtimeValueObserver<GamePublicRecord>,
): Unsubscribe {
  const path = firebasePaths.gamePublic(gameId);

  return observePath("observe-public-game", path, observer);
}

export function observeGameSettings(
  gameId: string,
  observer: RealtimeValueObserver<GameSettingsRecord>,
): Unsubscribe {
  const path = firebasePaths.gameSettings(gameId);

  return observePath("observe-game-settings", path, observer);
}

export function observeGamePlayers(
  gameId: string,
  observer: RealtimeValueObserver<Record<string, PublicPlayerRecord>>,
): Unsubscribe {
  const path = firebasePaths.gamePlayers(gameId);

  return observePath("observe-players", path, observer);
}

export function observePublicPlayer(
  gameId: string,
  uid: string,
  observer: RealtimeValueObserver<PublicPlayerRecord>,
): Unsubscribe {
  const path = firebasePaths.gamePlayer(gameId, uid);

  return observePath("observe-public-player", path, observer);
}

export function observeAuthenticatedPrivatePlayer(
  gameId: string,
  observer: RealtimeValueObserver<PrivatePlayerRecord>,
): Unsubscribe {
  const uid = firebaseAuth.currentUser?.uid;

  if (!uid) {
    const path = firebasePaths.gamePrivatePlayers(gameId);
    observer.onError(
      new RealtimeDatabaseRepositoryError(
        "observe-private-player",
        path,
        new Error("An authenticated Firebase user is required."),
      ),
    );

    return () => undefined;
  }

  const path = firebasePaths.gamePrivatePlayer(gameId, uid);

  return observePath("observe-private-player", path, observer);
}

export function observeHostPrivatePlayers(
  gameId: string,
  verifiedHostUid: string,
  observer: RealtimeValueObserver<Record<string, PrivatePlayerRecord>>,
): Unsubscribe {
  const authenticatedUid = firebaseAuth.currentUser?.uid;
  const path = firebasePaths.gamePrivatePlayers(gameId);

  if (!authenticatedUid || authenticatedUid !== verifiedHostUid) {
    observer.onError(
      new RealtimeDatabaseRepositoryError(
        "observe-host-private-players",
        path,
        new Error("The verified game host must be authenticated."),
      ),
    );

    return () => undefined;
  }

  return observePath("observe-host-private-players", path, observer);
}

export function observeHostDayVotes(
  gameId: string,
  dayNumber: number,
  verifiedHostUid: string,
  observer: RealtimeValueObserver<DayVotesRecord>,
): Unsubscribe {
  const path = firebasePaths.gameDayVotes(gameId, dayNumber);

  if (firebaseAuth.currentUser?.uid !== verifiedHostUid) {
    observer.onError(
      new RealtimeDatabaseRepositoryError(
        "observe-host-day-votes",
        path,
        new Error("The verified game host must be authenticated."),
      ),
    );
    return () => undefined;
  }

  return observePath("observe-host-day-votes", path, observer);
}

export function observeHostNightActions(
  gameId: string,
  nightId: string,
  verifiedHostUid: string,
  observer: RealtimeValueObserver<Record<string, HostNightActionEntry>>,
): Unsubscribe {
  const path = firebasePaths.gameHostNightActions(gameId, nightId);

  if (firebaseAuth.currentUser?.uid !== verifiedHostUid) {
    observer.onError(new RealtimeDatabaseRepositoryError(
      "observe-host-night-actions",
      path,
      new Error("The verified game host must be authenticated."),
    ));
    return () => undefined;
  }

  return observePath("observe-host-night-actions", path, observer);
}

export function observeHostNotes(
  gameId: string,
  nightId: string,
  verifiedHostUid: string,
  observer: RealtimeValueObserver<Record<string, HostNightNote>>,
): Unsubscribe {
  const path = firebasePaths.gameHostNotes(gameId, nightId);

  if (firebaseAuth.currentUser?.uid !== verifiedHostUid) {
    observer.onError(new RealtimeDatabaseRepositoryError(
      "observe-host-notes",
      path,
      new Error("The verified game host must be authenticated."),
    ));
    return () => undefined;
  }

  return observePath("observe-host-notes", path, observer);
}

export function observeHostNightSession(
  gameId: string,
  nightId: string,
  verifiedHostUid: string,
  observer: RealtimeValueObserver<NightSession>,
): Unsubscribe {
  const path = firebasePaths.gameNightSession(gameId, nightId);

  if (firebaseAuth.currentUser?.uid !== verifiedHostUid) {
    observer.onError(new RealtimeDatabaseRepositoryError(
      "observe-host-night-session",
      path,
      new Error("The verified game host must be authenticated."),
    ));
    return () => undefined;
  }

  return observePath("observe-host-night-session", path, observer);
}

function observeVerifiedHostPath<Value>(
  operation: RealtimeDatabaseOperation,
  path: FirebasePath,
  verifiedHostUid: string,
  observer: RealtimeValueObserver<Value>,
): Unsubscribe {
  if (firebaseAuth.currentUser?.uid !== verifiedHostUid) {
    observer.onError(new RealtimeDatabaseRepositoryError(operation, path, new Error("The verified game host must be authenticated.")));
    return () => undefined;
  }
  return observePath(operation, path, observer);
}

export function observeHostEvents(gameId: string, verifiedHostUid: string, observer: RealtimeValueObserver<Record<string, StoredGameEvent>>): Unsubscribe {
  return observeVerifiedHostPath("observe-host-events", firebasePaths.gameEvents(gameId), verifiedHostUid, observer);
}

export function observeHostNightSessions(gameId: string, verifiedHostUid: string, observer: RealtimeValueObserver<Record<string, NightSession>>): Unsubscribe {
  return observeVerifiedHostPath("observe-host-night-sessions", firebasePaths.gameNightSessions(gameId), verifiedHostUid, observer);
}

export function observeHostNightResolutions(gameId: string, verifiedHostUid: string, observer: RealtimeValueObserver<Record<string, NightResolutionRecord>>): Unsubscribe {
  return observeVerifiedHostPath("observe-host-night-resolutions", firebasePaths.gameNightResolutions(gameId), verifiedHostUid, observer);
}

export function observeHostAllNightActions(gameId: string, verifiedHostUid: string, observer: RealtimeValueObserver<Record<string, Record<string, HostNightActionEntry>>>): Unsubscribe {
  return observeVerifiedHostPath("observe-host-all-night-actions", firebasePaths.gameAllHostNightActions(gameId), verifiedHostUid, observer);
}

export function observeAuthenticatedAccusationVote(
  gameId: string,
  dayNumber: number,
  observer: RealtimeValueObserver<string>,
): Unsubscribe {
  const uid = firebaseAuth.currentUser?.uid;
  const path = uid
    ? firebasePaths.gameAccusation(gameId, dayNumber, uid)
    : firebasePaths.gameAccusations(gameId, dayNumber);

  if (!uid) {
    observer.onError(
      new RealtimeDatabaseRepositoryError(
        "observe-accusation-vote",
        path,
        new Error("An authenticated player is required."),
      ),
    );
    return () => undefined;
  }

  return observePath("observe-accusation-vote", path, observer);
}

export function observeAuthenticatedVerdictVote(
  gameId: string,
  dayNumber: number,
  observer: RealtimeValueObserver<VerdictVote>,
): Unsubscribe {
  const uid = firebaseAuth.currentUser?.uid;
  const path = uid
    ? firebasePaths.gameVerdict(gameId, dayNumber, uid)
    : firebasePaths.gameVerdicts(gameId, dayNumber);

  if (!uid) {
    observer.onError(
      new RealtimeDatabaseRepositoryError(
        "observe-verdict-vote",
        path,
        new Error("An authenticated player is required."),
      ),
    );
    return () => undefined;
  }

  return observePath("observe-verdict-vote", path, observer);
}

export async function applyAtomicUpdate(
  updates: AtomicUpdateMap,
): Promise<void> {
  try {
    await update(getDatabaseRootReference(), updates);
  } catch (error: unknown) {
    throw toRealtimeDatabaseError("atomic-update", "/", error);
  }
}
