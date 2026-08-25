import type {
  GamePublicRecord,
  GameSettingsRecord,
  PrivatePlayerRecord,
  PublicPlayerRecord,
} from "./schema";

function gamePath(gameId: string) {
  return `games/${gameId}` as const;
}

export const firebasePaths = {
  roomCodes: "roomCodes",
  games: "games",

  roomCode: (code: string) => `roomCodes/${code}` as const,
  game: gamePath,
  gameHostUid: (gameId: string) => `${gamePath(gameId)}/hostUid` as const,

  gamePublic: (gameId: string) => `${gamePath(gameId)}/public` as const,
  gamePublicField: <Field extends keyof GamePublicRecord & string>(
    gameId: string,
    field: Field,
  ) => `${gamePath(gameId)}/public/${field}` as const,

  gameSettings: (gameId: string) => `${gamePath(gameId)}/settings` as const,
  gameSettingsField: <Field extends keyof GameSettingsRecord & string>(
    gameId: string,
    field: Field,
  ) => `${gamePath(gameId)}/settings/${field}` as const,

  gamePlayers: (gameId: string) => `${gamePath(gameId)}/players` as const,
  gamePlayer: (gameId: string, uid: string) =>
    `${gamePath(gameId)}/players/${uid}` as const,
  gamePlayerField: <Field extends keyof PublicPlayerRecord & string>(
    gameId: string,
    uid: string,
    field: Field,
  ) => `${gamePath(gameId)}/players/${uid}/${field}` as const,

  gamePrivatePlayers: (gameId: string) =>
    `${gamePath(gameId)}/privatePlayers` as const,
  gamePrivatePlayer: (gameId: string, uid: string) =>
    `${gamePath(gameId)}/privatePlayers/${uid}` as const,
  gamePrivatePlayerField: <Field extends keyof PrivatePlayerRecord & string>(
    gameId: string,
    uid: string,
    field: Field,
  ) => `${gamePath(gameId)}/privatePlayers/${uid}/${field}` as const,
  gamePrivatePlayerStatus: (
    gameId: string,
    uid: string,
    statusId: string,
  ) => `${gamePath(gameId)}/privatePlayers/${uid}/statuses/${statusId}` as const,

  gamePhaseSessions: (gameId: string) =>
    `${gamePath(gameId)}/phaseSessions` as const,
  gamePhaseSession: (gameId: string, phaseSessionId: string) =>
    `${gamePath(gameId)}/phaseSessions/${phaseSessionId}` as const,
  gameNightSessions: (gameId: string) =>
    `${gamePath(gameId)}/nightSessions` as const,
  gameNightSession: (gameId: string, nightId: string) =>
    `${gamePath(gameId)}/nightSessions/${nightId}` as const,
  gameNightSessionActionsRevision: (gameId: string, nightId: string) =>
    `${gamePath(gameId)}/nightSessions/${nightId}/actionsRevision` as const,
  gameNightSessionPendingActionWrite: (gameId: string, nightId: string, entryId: string) =>
    `${gamePath(gameId)}/nightSessions/${nightId}/pendingActionWrites/${entryId}` as const,
  gameNightWakeChecklist: (gameId: string, nightId: string) =>
    `${gamePath(gameId)}/nightSessions/${nightId}/wakeChecklist` as const,
  gameNightWakeChecklistItem: (gameId: string, nightId: string, itemId: string) =>
    `${gamePath(gameId)}/nightSessions/${nightId}/wakeChecklist/${itemId}` as const,
  gameHostNightActions: (gameId: string, nightId: string) =>
    `${gamePath(gameId)}/hostNightActions/${nightId}` as const,
  gameAllHostNightActions: (gameId: string) =>
    `${gamePath(gameId)}/hostNightActions` as const,
  gameHostNightAction: (gameId: string, nightId: string, entryId: string) =>
    `${gamePath(gameId)}/hostNightActions/${nightId}/${entryId}` as const,
  gameHostNotes: (gameId: string, nightId: string) =>
    `${gamePath(gameId)}/hostNotes/${nightId}` as const,
  gameHostNote: (gameId: string, nightId: string, noteId: string) =>
    `${gamePath(gameId)}/hostNotes/${nightId}/${noteId}` as const,
  gameNightResolution: (gameId: string, nightId: string) =>
    `${gamePath(gameId)}/nightResolutions/${nightId}` as const,
  gameNightResolutions: (gameId: string) =>
    `${gamePath(gameId)}/nightResolutions` as const,
  gameNightResolutionVersion: (gameId: string, nightId: string, resolutionId: string) =>
    `${gamePath(gameId)}/nightResolutionVersions/${nightId}/${resolutionId}` as const,

  gameActions: (gameId: string) => `${gamePath(gameId)}/actions` as const,
  gameNightActions: (gameId: string, nightNumber: number) =>
    `${gamePath(gameId)}/actions/${nightNumber}` as const,
  gameNightAction: (gameId: string, nightNumber: number, uid: string) =>
    `${gamePath(gameId)}/actions/${nightNumber}/${uid}` as const,

  gameVotes: (gameId: string) => `${gamePath(gameId)}/votes` as const,
  gameDayVotes: (gameId: string, dayNumber: number) =>
    `${gamePath(gameId)}/votes/${dayNumber}` as const,
  gameAccusations: (gameId: string, dayNumber: number) =>
    `${gamePath(gameId)}/votes/${dayNumber}/accusations` as const,
  gameAccusation: (gameId: string, dayNumber: number, uid: string) =>
    `${gamePath(gameId)}/votes/${dayNumber}/accusations/${uid}` as const,
  gameVerdicts: (gameId: string, dayNumber: number) =>
    `${gamePath(gameId)}/votes/${dayNumber}/verdicts` as const,
  gameVerdict: (gameId: string, dayNumber: number, uid: string) =>
    `${gamePath(gameId)}/votes/${dayNumber}/verdicts/${uid}` as const,

  gameEvents: (gameId: string) => `${gamePath(gameId)}/events` as const,
  gameEvent: (gameId: string, eventId: string) =>
    `${gamePath(gameId)}/events/${eventId}` as const,
} as const;

type FirebasePathMember<Member> = Member extends (
  ...args: never[]
) => infer Path
  ? Path
  : Member;

export type FirebasePath = FirebasePathMember<
  (typeof firebasePaths)[keyof typeof firebasePaths]
>;
