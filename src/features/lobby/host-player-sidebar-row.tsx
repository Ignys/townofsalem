"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { getRoleById } from "@/data/roles";
import { HostPlayerAliveControl } from "@/features/game-state/host-player-alive-control";
import { HostPlayerStatusControl } from "@/features/game-state/host-player-status-control";
import type {
  PrivatePlayerRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";

import { kickPlayerFromGame } from "./host-player-actions";

interface HostPlayerSidebarRowProps {
  gameId: string;
  playerUid: string;
  player: PublicPlayerRecord;
  houseNumber: number;
  assignment?: PrivatePlayerRecord;
  rolesLoaded: boolean;
  gameStarted: boolean;
  statusEditable: boolean;
  reorderEnabled: boolean;
  onComposeAction?: (playerUid: string) => void;
}

export function HostPlayerSidebarRow({
  gameId,
  playerUid,
  player,
  houseNumber,
  assignment,
  rolesLoaded,
  gameStarted,
  statusEditable,
  reorderEnabled,
  onComposeAction,
}: HostPlayerSidebarRowProps) {
  const [confirmingKick, setConfirmingKick] = useState(false);
  const [kicking, setKicking] = useState(false);
  const [kickError, setKickError] = useState(false);
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform: sortableTransform,
    transition,
  } = useSortable({ id: playerUid, disabled: !reorderEnabled });
  const role = assignment ? getRoleById(assignment.roleId) : undefined;
  const transform = CSS.Transform.toString(sortableTransform);

  const handleKick = async () => {
    setKicking(true);
    setKickError(false);

    try {
      await kickPlayerFromGame(gameId, playerUid);
    } catch {
      setKickError(true);
      setConfirmingKick(false);
      setKicking(false);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform, transition }}
      className={`rounded-2xl border bg-black/20 p-3 transition-colors ${
        isDragging
          ? "z-10 border-[#d3b88c]/60 shadow-xl"
          : "border-white/8"
      } ${player.disconnected ? "opacity-60" : ""}`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          disabled={!reorderEnabled}
          aria-label={`Mover ${player.name} para outra casa`}
          className="flex size-10 touch-none items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-[#d3b88c] hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-default disabled:text-[#756f68]"
        >
          ⠿
        </button>

        <div className="min-w-0">
          <p className="truncate font-semibold text-[#fffaf0]">{player.name}</p>
          <p className="mt-0.5 text-xs text-[#9f9990]">
            {player.disconnected ? "Desconectado" : `Casa ${houseNumber}`}
          </p>
        </div>

        {gameStarted ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              player.alive
                ? "bg-[#6f9b77]/15 text-[#bfe0c5]"
                : "bg-[#a33843]/15 text-[#f0b9bd]"
            }`}
          >
            {player.alive ? "Vivo" : "Morto"}
          </span>
        ) : (
          <span className="rounded-lg bg-[#d3b88c]/10 px-2.5 py-1 font-mono text-sm font-bold text-[#e6cfa9]">
            {houseNumber}
          </span>
        )}
      </div>

      {gameStarted && (
        <div className="mt-3 border-t border-white/8 pt-3">
          <p className="text-sm font-semibold text-[#d3b88c]">
            {assignment
              ? role?.name ?? "Role não reconhecida"
              : rolesLoaded
                ? "Role não atribuída"
                : "Carregando role…"}
          </p>
          <HostPlayerAliveControl
            gameId={gameId}
            playerUid={playerUid}
            playerName={player.name}
            alive={player.alive}
            disabled={!statusEditable}
          />
          <div className="mt-2 flex justify-end">
            <HostPlayerStatusControl
              gameId={gameId}
              playerUid={playerUid}
              roleId={role?.id}
              statuses={assignment?.statuses}
              disabled={!statusEditable}
            />
          </div>
          {onComposeAction && role?.actionDefinitions?.length ? (
            <button
              type="button"
              onClick={() => onComposeAction(playerUid)}
              className="mt-2 min-h-9 w-full rounded-lg border border-[#d3b88c]/25 px-3 text-xs font-bold text-[#e6cfa9] hover:bg-[#d3b88c]/8"
            >
              Registrar ação
            </button>
          ) : null}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/8 pt-2">
        <p
          role={kickError ? "alert" : undefined}
          className="min-w-0 text-xs text-[#9f9990]"
        >
          {kickError ? "Não foi possível expulsar." : confirmingKick ? "Expulsar da sala?" : ""}
        </p>
        <div className="flex shrink-0 gap-2">
          {confirmingKick && (
            <button
              type="button"
              onClick={() => setConfirmingKick(false)}
              disabled={kicking}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#bdb7ad] hover:bg-white/8 disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={() => confirmingKick ? void handleKick() : setConfirmingKick(true)}
            disabled={kicking}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#f0b9bd] hover:bg-[#a33843]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-50"
          >
            {kicking ? "Expulsando…" : confirmingKick ? "Confirmar" : "Expulsar"}
          </button>
        </div>
      </div>
    </li>
  );
}
