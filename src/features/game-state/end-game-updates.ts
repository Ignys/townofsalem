import { firebasePaths } from "@/lib/firebase/paths";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";
import type { AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";

/** As roles de todos, para a tela de fim de jogo. Só são públicas depois que a partida acaba. */
export function getFinalRoles(
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>> | null | undefined,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(privatePlayers ?? {}).flatMap(([uid, player]) =>
      player.roleId ? [[uid, player.roleId]] : [],
    ),
  );
}

export interface EndGameWinners {
  factions?: readonly string[];
  playerUids?: readonly string[];
}

interface EndGameUpdateInput {
  gameId: string;
  hostUid: string;
  playerUids: readonly string[];
  winners: EndGameWinners;
  endedAt: number;
  eventId: string;
}

export function createEndGameUpdates({
  gameId,
  hostUid,
  playerUids,
  winners,
  endedAt,
  eventId,
}: EndGameUpdateInput): AtomicUpdateMap {
  const winningFactions = [...(winners.factions ?? [])];
  const winningPlayerUids = [...(winners.playerUids ?? [])];
  const updates: AtomicUpdateMap = {
    [firebasePaths.gamePublicField(gameId, "status")]: "lobby",
    [firebasePaths.gamePublicField(gameId, "phase")]: "lobby",
    [firebasePaths.gamePublicField(gameId, "day")]: 0,
    [firebasePaths.gamePublicField(gameId, "phaseLabel")]: "Lobby",
    [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]: null,
    [firebasePaths.gamePublicField(gameId, "timerPaused")]: false,
    [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]: null,
    [firebasePaths.gamePublicField(gameId, "accusedPlayerUid")]: null,
    [firebasePaths.gamePublicField(gameId, "verdictClosedAt")]: null,
    [firebasePaths.gamePublicField(gameId, "verdictOutcome")]: null,
    [firebasePaths.gamePublicField(gameId, "phaseSessionId")]: null,
    [firebasePaths.gamePublicField(gameId, "currentNightId")]: null,
    [firebasePaths.gamePublicField(gameId, "phaseSequenceNumber")]: 0,
    [firebasePaths.gamePublicField(gameId, "nightNumber")]: 0,
    [firebasePaths.gamePublicField(gameId, "winningFactions")]: null,
    [firebasePaths.gamePublicField(gameId, "winningPlayerUids")]: null,
    [firebasePaths.gamePublicField(gameId, "finalRoles")]: null,
    [firebasePaths.gamePublicField(gameId, "gameEndedAt")]: null,
    [firebasePaths.gameSettingsField(gameId, "rolesAssignedAt")]: null,
    [firebasePaths.gamePrivatePlayers(gameId)]: null,
    [firebasePaths.gameActions(gameId)]: null,
    [firebasePaths.gameVotes(gameId)]: null,
    // Resultados e anúncios são da partida que acabou; a próxima começa limpa.
    [firebasePaths.gameDayAnnouncements(gameId)]: null,
    [firebasePaths.gameAllPlayerDawnResults(gameId)]: null,
    [firebasePaths.gameAllPlayerInstantResults(gameId)]: null,
    [firebasePaths.gameMayorReveals(gameId)]: null,
    [firebasePaths.gameAllJesterRevenges(gameId)]: null,
    [firebasePaths.gameMafiaTeam(gameId)]: null,
    [firebasePaths.gameMafiaBoards(gameId)]: null,
    [firebasePaths.gameAllMafiaReactions(gameId)]: null,
    [firebasePaths.gameAllNightPasses(gameId)]: null,
    [firebasePaths.gameAllDawnReady(gameId)]: null,
    [firebasePaths.gameEvent(gameId, eventId)]: {
      type: "GAME_ENDED",
      timestamp: endedAt,
      actorUid: hostUid,
      visibility: "public",
      payload: {
        endedByHost: true,
        returnedToLobby: true,
        winningFactions,
        winningPlayerUids,
      },
    },
  };

  playerUids.forEach((playerUid) => {
    updates[firebasePaths.gamePlayerField(gameId, playerUid, "alive")] = true;
  });

  return updates;
}
