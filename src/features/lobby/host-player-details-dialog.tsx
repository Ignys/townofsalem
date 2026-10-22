"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Ban, House, Skull, UserRound, X } from "lucide-react";

import { HostPlayerAliveControl } from "@/features/game-state/host-player-alive-control";
import { HostPlayerStatusControl } from "@/features/game-state/host-player-status-control";
import {
  getUnrecordedPlayerDeathDetails,
  type PlayerDeathDetails,
} from "@/features/game-state/player-death-details";
import { RoleInteractionLimitNotice } from "@/features/roles/role-interaction-limit-notice";
import { getRoleResourceUsage } from "@/features/roles/role-resource-usage";
import { FACTION_LABELS } from "@/features/roles/role-presentation";
import { roleNameColor } from "@/features/roles/role-colors";
import type {
  PrivatePlayerRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";
import type { HostNightActionEntry, RoleDefinition } from "@/types";

import { HostForcedRoleControl } from "./host-forced-role-control";
import { HostPlayerInteractionHistory } from "./host-player-interaction-history";
import { HostPlayerNameEditor } from "./host-player-name-editor";

interface HostPlayerDetailsDialogProps {
  gameId: string;
  playerUid: string;
  player: PublicPlayerRecord;
  playerCount: number;
  houseNumber: number;
  assignment?: PrivatePlayerRecord;
  actionHistory: readonly HostNightActionEntry[];
  actionHistoryLoaded: boolean;
  nightNumberById: Readonly<Record<string, number>>;
  playerNames: Readonly<Record<string, string>>;
  deathDetails?: PlayerDeathDetails;
  role?: RoleDefinition;
  roleLabel: string;
  gameStarted: boolean;
  statusEditable: boolean;
  open: boolean;
  onClose: () => void;
  onRequestKick?: () => void;
  onComposeAction?: (playerUid: string) => void;
}

export function HostPlayerDetailsDialog({
  gameId,
  playerUid,
  player,
  playerCount,
  houseNumber,
  assignment,
  actionHistory,
  actionHistoryLoaded,
  nightNumberById,
  playerNames,
  deathDetails,
  role,
  roleLabel,
  gameStarted,
  statusEditable,
  open,
  onClose,
  onRequestKick,
  onComposeAction,
}: HostPlayerDetailsDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const canComposeAction =
    Boolean(onComposeAction) && Boolean(role?.actionDefinitions?.length);
  const resourceUsage = role && (role.id === "janitor" || actionHistoryLoaded)
    ? getRoleResourceUsage({
        actionEntries: actionHistory,
        assignment,
        playerCount,
        playerUid,
        roleId: role.id,
      })
    : null;
  const displayedDeathDetails = player.alive
    ? null
    : deathDetails ?? getUnrecordedPlayerDeathDetails();

  return createPortal(
    <div
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm max-sm:items-end max-sm:overflow-hidden max-sm:p-0"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#2e3136] bg-[#1b1d20] shadow-2xl max-sm:my-0 max-sm:flex max-sm:max-h-[92svh] max-sm:flex-col max-sm:rounded-b-none max-sm:rounded-t-[1.75rem] max-sm:border-b-0 max-sm:animate-[sheet-up_220ms_ease-out] motion-reduce:animate-none"
      >
        <span aria-hidden="true" className="mx-auto mt-2.5 block h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 max-sm:border-b-0 max-sm:pt-3 max-sm:pb-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#d3b88c]/10 font-mono text-sm font-bold text-[#e6cfa9] max-sm:size-14 max-sm:border max-sm:border-[#d3b88c]/35 max-sm:bg-[#d3b88c]/[0.08] max-sm:font-serif max-sm:text-2xl max-sm:font-semibold max-sm:text-[#f6dfb5]">
              {houseNumber}
            </span>
            <div className="w-fit min-w-0">
              <HostPlayerNameEditor
                gameId={gameId}
                playerUid={playerUid}
                name={player.name}
                titleId={titleId}
              />
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold sm:hidden">
                {gameStarted && (
                  <span className={`rounded-full px-2 py-0.5 ${player.alive ? "bg-[#6f9b77]/15 text-[#bfe0c5]" : "bg-[#a33843]/20 text-[#f0b9bd]"}`}>
                    {player.alive ? "Vivo" : "Morto"}
                  </span>
                )}
                <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-0.5 text-[#bdb7ad]">
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${player.isBot ? "bg-[#8d877e]" : player.disconnected ? "bg-[#a33843]" : "bg-[#6f9b77]"}`} />
                  {player.isBot ? "Bot" : player.disconnected ? "Desconectado" : "Conectado"}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Fechar detalhes do jogador"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[#9f9990] max-sm:size-11 max-sm:rounded-full max-sm:bg-white/5 hover:bg-white/8 hover:text-[#fffaf0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c]"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </header>

        <div className="max-h-[min(75vh,42rem)] space-y-2 overflow-y-auto p-5 max-sm:max-h-none max-sm:flex-1 max-sm:space-y-0 max-sm:pt-2 max-sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {!gameStarted && (
            <HostForcedRoleControl gameId={gameId} playerUid={playerUid} />
          )}
          {gameStarted && (
          <section className="rounded-xl border border-white/8 bg-black/15 p-4 max-sm:rounded-none max-sm:border-0 max-sm:border-b max-sm:border-white/7 max-sm:bg-transparent max-sm:px-0 max-sm:py-4">
            <p className="text-xs font-semibold text-[#9f9990]">
              Role
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="font-serif text-lg font-semibold text-[#fffaf0] max-sm:text-2xl" style={role ? { color: roleNameColor(role.id, role.faction) } : undefined}>
                {roleLabel}
              </p>
              {role && (
                <span className="rounded-full border border-[#d3b88c]/20 px-2 py-0.5 text-xs font-semibold text-[#e6cfa9]">
                  {FACTION_LABELS[role.faction]}
                </span>
              )}
            </div>
            {role?.description && (
              <>
                <p className="mt-2 text-sm leading-6 text-[#bdb7ad]">
                  {role.description}
                </p>
                <div className="mt-4">
                  <RoleInteractionLimitNotice
                    roleId={role.id}
                    playerCount={playerCount}
                    resourceUsage={resourceUsage}
                  />
                </div>
              </>
            )}
          </section>
          )}
          <section className="grid grid-cols-2 gap-3 max-sm:hidden">
            <div className="rounded-xl border border-white/8 bg-black/15 p-3">
              <p className="flex items-center gap-2 text-xs text-[#9f9990]">
                <House aria-hidden="true" size={14} />
                Estado
              </p>
              <p
                className={`mt-2 text-sm font-bold ${
                  player.alive ? "text-[#bfe0c5]" : "text-[#f0b9bd]"
                }`}
              >
                {player.alive ? "Vivo" : "Morto"}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/15 p-3">
              <p className="flex items-center gap-2 text-xs text-[#9f9990]">
                <UserRound aria-hidden="true" size={14} />
                Conexão
              </p>
              <p className="mt-2 text-sm font-semibold text-[#d8d2c8]">
                {player.isBot
                  ? "Bot"
                  : player.disconnected
                    ? "Desconectado"
                    : "Conectado"}
              </p>
            </div>
          </section>

          {displayedDeathDetails && (
            <section className="rounded-xl border border-red-300/15 bg-red-400/[0.06] p-4 max-sm:rounded-none max-sm:border-0 max-sm:border-b max-sm:border-white/7 max-sm:bg-transparent max-sm:px-0 max-sm:py-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-[#f0b9bd]">
                <Skull aria-hidden="true" size={15} />
                Como morreu
              </p>
              <p className="mt-2 text-sm leading-6 text-[#d8d2c8]">
                {displayedDeathDetails.description}
              </p>
            </section>
          )}

          <HostPlayerInteractionHistory
            actionEntries={actionHistory}
            loaded={actionHistoryLoaded}
            nightNumberById={nightNumberById}
            playerNames={playerNames}
            playerUid={playerUid}
          />

          <section className={`rounded-xl border border-white/8 bg-black/15 p-4 max-sm:rounded-none max-sm:border-0 max-sm:border-b max-sm:border-white/7 max-sm:bg-transparent max-sm:px-0 max-sm:py-4 ${gameStarted ? "" : "max-sm:hidden"}`}>
            <p className="text-xs font-semibold text-[#9f9990]">
              Controles da partida
            </p>
            {gameStarted ? (
              <div className="mt-3 space-y-3">
                <HostPlayerAliveControl
                  gameId={gameId}
                  playerUid={playerUid}
                  playerName={player.name}
                  alive={player.alive}
                  disabled={!statusEditable}
                />
                <div className="flex justify-end">
                  <HostPlayerStatusControl
                    gameId={gameId}
                    playerUid={playerUid}
                    roleId={role?.id}
                    statuses={assignment?.statuses}
                    disabled={!statusEditable}
                  />
                </div>
                {canComposeAction && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onComposeAction?.(playerUid);
                    }}
                    className="min-h-10 w-full rounded-xl border border-[#d3b88c]/25 px-3 text-sm font-bold text-[#e6cfa9] hover:bg-[#d3b88c]/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c]"
                  >
                    Registrar ação
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#9f9990]">
                Os controles de estado ficam disponíveis após o início da
                partida.
              </p>
            )}
          </section>

          {onRequestKick && (
            <button
              type="button"
              onClick={onRequestKick}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#a33843]/35 max-sm:min-h-12 text-sm font-bold text-[#f0b9bd] hover:bg-[#a33843]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c]"
            >
              <Ban aria-hidden="true" size={17} />
              {player.isBot ? "Remover bot" : "Expulsar jogador"}
            </button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
