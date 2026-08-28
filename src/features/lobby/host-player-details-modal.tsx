"use client";

import { getRoleById } from "@/data/roles";
import type { PlayerDeathDetails } from "@/features/game-state/player-death-details";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";
import type { HostNightActionEntry, Player } from "@/types";

import { HostPlayerDetailsDialog } from "./host-player-details-dialog";

interface HostPlayerDetailsModalProps {
  gameId: string;
  playerUid: string | null;
  players: readonly Player[];
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>>;
  actionHistory: readonly HostNightActionEntry[];
  actionHistoryLoaded: boolean;
  nightNumberById: Readonly<Record<string, number>>;
  playerNames: Readonly<Record<string, string>>;
  deathDetailsByPlayer?: Readonly<Record<string, PlayerDeathDetails>>;
  statusEditable?: boolean;
  onClose: () => void;
  onComposeAction?: (playerUid: string) => void;
}

export function HostPlayerDetailsModal({
  gameId,
  playerUid,
  players,
  privatePlayers,
  actionHistory,
  actionHistoryLoaded,
  nightNumberById,
  playerNames,
  deathDetailsByPlayer = {},
  statusEditable = false,
  onClose,
  onComposeAction,
}: HostPlayerDetailsModalProps) {
  if (!playerUid) {
    return null;
  }

  const playerIndex = players.findIndex((player) => player.uid === playerUid);
  const player = players[playerIndex];
  if (!player) {
    return null;
  }

  const assignment = privatePlayers[playerUid];
  const role = assignment ? getRoleById(assignment.roleId) : undefined;
  const roleLabel = assignment
    ? role?.name ?? "Role não reconhecida"
    : "Role não atribuída";

  return (
    <HostPlayerDetailsDialog
      gameId={gameId}
      playerUid={playerUid}
      player={player}
      playerCount={players.length}
      houseNumber={player.seat ?? playerIndex + 1}
      assignment={assignment}
      actionHistory={actionHistory}
      actionHistoryLoaded={actionHistoryLoaded}
      nightNumberById={nightNumberById}
      playerNames={playerNames}
      deathDetails={deathDetailsByPlayer[playerUid]}
      role={role}
      roleLabel={roleLabel}
      gameStarted
      statusEditable={statusEditable}
      open
      onClose={onClose}
      onComposeAction={onComposeAction}
    />
  );
}
