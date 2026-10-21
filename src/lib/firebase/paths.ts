import type { NightTeam } from "@/types";
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
  openRooms: "openRooms",
  openRoom: (code: string) => `openRooms/${code}` as const,
  openRoomPlayerCount: (code: string) =>
    `openRooms/${code}/playerCount` as const,
  openRoomStatus: (code: string) => `openRooms/${code}/status` as const,
  rolePresets: "rolePresets",
  rolePreset: (presetId: string) => `rolePresets/${presetId}` as const,
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

  gameRoleHistory: (gameId: string) => `${gamePath(gameId)}/roleHistory` as const,
  gameForcedRoles: (gameId: string) => `${gamePath(gameId)}/forcedRoles` as const,
  gameForcedRole: (gameId: string, uid: string) =>
    `${gamePath(gameId)}/forcedRoles/${uid}` as const,

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

  gameGraveyard: (gameId: string) => `${gamePath(gameId)}/graveyard` as const,
  gameGraveyardEntry: (gameId: string, uid: string) =>
    `${gamePath(gameId)}/graveyard/${uid}` as const,

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
  gamePlayerNightActions: (gameId: string, nightId: string) =>
    `${gamePath(gameId)}/playerNightActions/${nightId}` as const,
  gamePlayerNightActionsForPlayer: (gameId: string, nightId: string, uid: string) =>
    `${gamePath(gameId)}/playerNightActions/${nightId}/${uid}` as const,
  gamePlayerNightAction: (gameId: string, nightId: string, uid: string, actionId: string) =>
    `${gamePath(gameId)}/playerNightActions/${nightId}/${uid}/${actionId}` as const,

  gamePlayerInstantNightResults: (gameId: string, uid: string) =>
    `${gamePath(gameId)}/playerInstantResults/${uid}` as const,
  gamePlayerInstantNightResult: (gameId: string, uid: string, nightId: string, resultKey: string) =>
    `${gamePath(gameId)}/playerInstantResults/${uid}/${nightId}/${resultKey}` as const,
  gamePlayerDawnNightResults: (gameId: string, uid: string) =>
    `${gamePath(gameId)}/playerDawnResults/${uid}` as const,
  gamePlayerDawnNightResult: (gameId: string, uid: string, nightId: string) =>
    `${gamePath(gameId)}/playerDawnResults/${uid}/${nightId}` as const,
  gameDayAnnouncements: (gameId: string) =>
    `${gamePath(gameId)}/dayAnnouncements` as const,
  gameDayAnnouncement: (gameId: string, nightId: string) =>
    `${gamePath(gameId)}/dayAnnouncements/${nightId}` as const,

  gameJesterRevenges: (gameId: string, dayNumber: number) =>
    `${gamePath(gameId)}/jesterRevenge/${dayNumber}` as const,
  gameJesterRevenge: (gameId: string, dayNumber: number, uid: string) =>
    `${gamePath(gameId)}/jesterRevenge/${dayNumber}/${uid}` as const,

  gameAllPlayerDawnResults: (gameId: string) => `${gamePath(gameId)}/playerDawnResults` as const,
  gameAllPlayerInstantResults: (gameId: string) => `${gamePath(gameId)}/playerInstantResults` as const,
  gameAllJesterRevenges: (gameId: string) => `${gamePath(gameId)}/jesterRevenge` as const,
  gameMayorReveals: (gameId: string) => `${gamePath(gameId)}/mayorReveals` as const,
  gameMayorReveal: (gameId: string, uid: string) => `${gamePath(gameId)}/mayorReveals/${uid}` as const,

  // A Máfia e os Vampiros usam a mesma estrutura, com o prefixo do grupo.
  gameMafiaTeam: (gameId: string, team: NightTeam = "mafia") => `${gamePath(gameId)}/${team}Team` as const,
  gameMafiaBoards: (gameId: string, team: NightTeam = "mafia") => `${gamePath(gameId)}/${team}Board` as const,
  gameMafiaBoard: (gameId: string, nightId: string, team: NightTeam = "mafia") => `${gamePath(gameId)}/${team}Board/${nightId}` as const,
  gameMafiaBoardPick: (gameId: string, nightId: string, uid: string, actionId: string, team: NightTeam = "mafia") =>
    `${gamePath(gameId)}/${team}Board/${nightId}/${uid}/${actionId}` as const,
  gameAllMafiaReactions: (gameId: string, team: NightTeam = "mafia") => `${gamePath(gameId)}/${team}Reactions` as const,
  gameMafiaReactions: (gameId: string, nightId: string, team: NightTeam = "mafia") => `${gamePath(gameId)}/${team}Reactions/${nightId}` as const,
  gameMafiaReaction: (gameId: string, nightId: string, reactionId: string, team: NightTeam = "mafia") =>
    `${gamePath(gameId)}/${team}Reactions/${nightId}/${reactionId}` as const,

  gameNightPasses: (gameId: string, nightId: string) => `${gamePath(gameId)}/nightPasses/${nightId}` as const,
  gameNightPass: (gameId: string, nightId: string, uid: string) =>
    `${gamePath(gameId)}/nightPasses/${nightId}/${uid}` as const,
  gameAllNightPasses: (gameId: string) => `${gamePath(gameId)}/nightPasses` as const,
  gameDawnReadyDay: (gameId: string, day: number) => `${gamePath(gameId)}/dawnReady/${day}` as const,
  gameDawnReady: (gameId: string, day: number, uid: string) => `${gamePath(gameId)}/dawnReady/${day}/${uid}` as const,
  gameAllDawnReady: (gameId: string) => `${gamePath(gameId)}/dawnReady` as const,

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
