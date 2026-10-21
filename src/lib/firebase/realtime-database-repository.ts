"use client";

import {
  onValue,
  update,
  type DataSnapshot,
  type Unsubscribe,
} from "firebase/database";

import type {
  DayAnnouncementRecord,
  MafiaBoardPickRecord,
  MafiaReactionRecord,
  MafiaTeamMemberRecord,
  NightTeam,
  HostNightActionEntry,
  HostNightNote,
  NightSession,
  NightResolutionRecord,
  PhaseSession,
  PlayerDawnNightResultRecord,
  PlayerInstantNightResultRecord,
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
  GraveyardEntryRecord,
  NightActionRecord,
  PrivatePlayerRecord,
  PublicPlayerRecord,
  RoomCodeRecord,
  StoredGameEvent,
  VerdictVote,
} from "./schema";
import type { GameVariants } from "@/game-engine/variants";
import type { PlayerNightActionSubmission } from "@/types";

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
  | PlayerNightActionSubmission
  | HostNightNote
  | WakeChecklistState
  | NightResolutionRecord
  | PlayerInstantNightResultRecord
  | PlayerDawnNightResultRecord
  | DayAnnouncementRecord
  | MafiaTeamMemberRecord
  | MafiaBoardPickRecord
  | MafiaReactionRecord
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

export function observeForcedRoles(
  gameId: string,
  observer: RealtimeValueObserver<Record<string, string>>,
): Unsubscribe {
  return observePath("observe-forced-roles", firebasePaths.gameForcedRoles(gameId), observer);
}

export function observeGamePlayers(
  gameId: string,
  observer: RealtimeValueObserver<Record<string, PublicPlayerRecord>>,
): Unsubscribe {
  const path = firebasePaths.gamePlayers(gameId);

  return observePath("observe-players", path, observer);
}

export function observeGameGraveyard(
  gameId: string,
  observer: RealtimeValueObserver<Record<string, GraveyardEntryRecord>>,
): Unsubscribe {
  return observePath("observe-graveyard", firebasePaths.gameGraveyard(gameId), observer);
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

/**
 * O RTDB não guarda listas vazias: uma ação sem alvo (alerta do Veteran, colete do Survivor)
 * volta sem `targetUids`. Quem lê sempre recebe uma lista.
 */
function withTargetList<Entry extends { targetUids?: readonly string[] }>(entry: Entry): Entry {
  return Array.isArray(entry.targetUids) ? entry : { ...entry, targetUids: [] };
}

function mapRecord<Value>(record: Record<string, Value> | null, map: (value: Value) => Value): Record<string, Value> | null {
  return record ? Object.fromEntries(Object.entries(record).map(([key, value]) => [key, map(value)])) : record;
}

function normalizedEntries<Entry extends { targetUids?: readonly string[] }>(
  observer: RealtimeValueObserver<Record<string, Entry>>,
): RealtimeValueObserver<Record<string, Entry>> {
  return { ...observer, onData: (value) => observer.onData(mapRecord(value, withTargetList)) };
}

function normalizedNestedEntries<Entry extends { targetUids?: readonly string[] }>(
  observer: RealtimeValueObserver<Record<string, Record<string, Entry>>>,
): RealtimeValueObserver<Record<string, Record<string, Entry>>> {
  return {
    ...observer,
    onData: (value) => observer.onData(mapRecord(value, (inner) => mapRecord(inner, withTargetList) ?? inner)),
  };
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

  return observePath("observe-host-night-actions", path, normalizedEntries(observer));
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
  return observeVerifiedHostPath("observe-host-all-night-actions", firebasePaths.gameAllHostNightActions(gameId), verifiedHostUid, normalizedNestedEntries(observer));
}

export function observeHostPlayerNightActions(
  gameId: string,
  nightId: string,
  verifiedHostUid: string,
  observer: RealtimeValueObserver<Record<string, Record<string, PlayerNightActionSubmission>>>,
): Unsubscribe {
  return observeVerifiedHostPath(
    "observe-host-player-night-actions",
    firebasePaths.gamePlayerNightActions(gameId, nightId),
    verifiedHostUid,
    normalizedNestedEntries(observer),
  );
}

/** Placar de acusações ao vivo. Legível por qualquer membro da partida. */
export function observePublicAccusations(
  gameId: string,
  dayNumber: number,
  observer: RealtimeValueObserver<Record<string, string>>,
): Unsubscribe {
  return observePath(
    "observe-public-accusations",
    firebasePaths.gameAccusations(gameId, dayNumber),
    observer,
  );
}

/** Submissões de noite do próprio jogador autenticado. */
export function observeAuthenticatedPlayerNightActions(
  gameId: string,
  nightId: string,
  observer: RealtimeValueObserver<Record<string, PlayerNightActionSubmission>>,
): Unsubscribe {
  const uid = firebaseAuth.currentUser?.uid;
  const path = uid
    ? firebasePaths.gamePlayerNightActionsForPlayer(gameId, nightId, uid)
    : firebasePaths.gamePlayerNightActions(gameId, nightId);

  if (!uid) {
    observer.onError(
      new RealtimeDatabaseRepositoryError(
        "observe-player-night-actions",
        path,
        new Error("An authenticated player is required."),
      ),
    );
    return () => undefined;
  }

  return observePath("observe-player-night-actions", path, normalizedEntries(observer));
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

function observeAuthenticatedPlayerPath<Value>(
  operation: RealtimeDatabaseOperation,
  buildPath: (uid: string) => FirebasePath,
  observer: RealtimeValueObserver<Value>,
): Unsubscribe {
  const uid = firebaseAuth.currentUser?.uid;

  if (!uid) {
    observer.onError(
      new RealtimeDatabaseRepositoryError(
        operation,
        buildPath("anonymous"),
        new Error("An authenticated player is required."),
      ),
    );
    return () => undefined;
  }

  return observePath(operation, buildPath(uid), observer);
}

/** Investigações e pistas entregues ao próprio jogador, por noite. */
export function observeAuthenticatedPlayerInstantResults(
  gameId: string,
  observer: RealtimeValueObserver<Record<string, Record<string, PlayerInstantNightResultRecord>>>,
): Unsubscribe {
  return observeAuthenticatedPlayerPath(
    "observe-player-instant-results",
    (uid) => firebasePaths.gamePlayerInstantNightResults(gameId, uid),
    observer,
  );
}

/** O que o jogador descobriu ao amanhecer. A regra só libera fora da noite. */
export function observeAuthenticatedPlayerDawnResults(
  gameId: string,
  observer: RealtimeValueObserver<Record<string, PlayerDawnNightResultRecord>>,
): Unsubscribe {
  return observeAuthenticatedPlayerPath(
    "observe-player-dawn-results",
    (uid) => firebasePaths.gamePlayerDawnNightResults(gameId, uid),
    observer,
  );
}

/** Anúncios do amanhecer. A regra só libera fora da noite. */
export function observeDayAnnouncements(
  gameId: string,
  observer: RealtimeValueObserver<Record<string, DayAnnouncementRecord>>,
): Unsubscribe {
  return observePath("observe-day-announcements", firebasePaths.gameDayAnnouncements(gameId), observer);
}

/** Votos de veredito ao vivo. Públicos para todos os membros da partida. */
export function observePublicVerdicts(
  gameId: string,
  dayNumber: number,
  observer: RealtimeValueObserver<Record<string, VerdictVote>>,
): Unsubscribe {
  return observePath("observe-public-verdicts", firebasePaths.gameVerdicts(gameId, dayNumber), observer);
}

/** Escolhas de vingança do Jester no dia. Só o mestre lê todas. */
/** A vingança que o próprio Jester escolheu nesta noite (a regra só libera a dele). */
export function observeAuthenticatedJesterRevenge(
  gameId: string,
  dayNumber: number,
  observer: RealtimeValueObserver<string>,
): Unsubscribe {
  return observeAuthenticatedPlayerPath(
    "observe-player-jester-revenge",
    (uid) => firebasePaths.gameJesterRevenge(gameId, dayNumber, uid),
    observer,
  );
}

export function observeHostJesterRevenges(
  gameId: string,
  dayNumber: number,
  verifiedHostUid: string,
  observer: RealtimeValueObserver<Record<string, string>>,
): Unsubscribe {
  return observeVerifiedHostPath(
    "observe-host-jester-revenges",
    firebasePaths.gameJesterRevenges(gameId, dayNumber),
    verifiedHostUid,
    observer,
  );
}

/** Mayors que se revelaram (uid → momento). Público para a partida. */
export function observeMayorReveals(
  gameId: string,
  observer: RealtimeValueObserver<Record<string, number>>,
): Unsubscribe {
  return observePath("observe-mayor-reveals", firebasePaths.gameMayorReveals(gameId), observer);
}

/** Quem é da Máfia (só a Máfia e o mestre leem). */
export function observeMafiaTeam(
  gameId: string,
  observer: RealtimeValueObserver<Record<string, MafiaTeamMemberRecord>>,
  team: NightTeam = "mafia",
): Unsubscribe {
  return observePath("observe-mafia-team", firebasePaths.gameMafiaTeam(gameId, team), observer);
}

/** Escolhas ao vivo da Máfia nesta noite. */
export function observeMafiaBoard(
  gameId: string,
  nightId: string,
  observer: RealtimeValueObserver<Record<string, Record<string, MafiaBoardPickRecord>>>,
  team: NightTeam = "mafia",
): Unsubscribe {
  return observePath("observe-mafia-board", firebasePaths.gameMafiaBoard(gameId, nightId, team), observer);
}

/** Reações da Máfia nesta noite. */
export function observeMafiaReactions(
  gameId: string,
  nightId: string,
  observer: RealtimeValueObserver<Record<string, MafiaReactionRecord>>,
  team: NightTeam = "mafia",
): Unsubscribe {
  return observePath("observe-mafia-reactions", firebasePaths.gameMafiaReactions(gameId, nightId, team), observer);
}

/** Quem passou a noite (ritmo rápido). Só o mestre lê todos. */
export function observeHostNightPasses(
  gameId: string,
  nightId: string,
  verifiedHostUid: string,
  observer: RealtimeValueObserver<Record<string, number>>,
): Unsubscribe {
  return observeVerifiedHostPath("observe-host-night-passes", firebasePaths.gameNightPasses(gameId, nightId), verifiedHostUid, observer);
}

/** Quem já apertou "Pronto" na preparação. Todos os jogadores da partida leem. */
export function observeDawnReady(
  gameId: string,
  day: number,
  observer: RealtimeValueObserver<Record<string, number>>,
): Unsubscribe {
  return observePath("observe-dawn-ready", firebasePaths.gameDawnReadyDay(gameId, day), observer);
}

/** Se o próprio jogador já passou esta noite (ritmo rápido). */
export function observeAuthenticatedNightPass(
  gameId: string,
  nightId: string,
  observer: RealtimeValueObserver<number>,
): Unsubscribe {
  return observeAuthenticatedPlayerPath(
    "observe-night-pass",
    (uid) => firebasePaths.gameNightPass(gameId, nightId, uid),
    observer,
  );
}
