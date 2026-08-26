"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Ban, Bot, House, UserRound, X } from "lucide-react";

import { HostPlayerAliveControl } from "@/features/game-state/host-player-alive-control";
import { HostPlayerStatusControl } from "@/features/game-state/host-player-status-control";
import { FACTION_LABELS } from "@/features/roles/role-presentation";
import type {
  PrivatePlayerRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";
import type { RoleDefinition } from "@/types";

import { HostBotNameEditor } from "./host-bot-name-editor";

interface HostPlayerDetailsDialogProps {
  gameId: string;
  playerUid: string;
  player: PublicPlayerRecord;
  houseNumber: number;
  assignment?: PrivatePlayerRecord;
  role?: RoleDefinition;
  roleLabel: string;
  gameStarted: boolean;
  statusEditable: boolean;
  open: boolean;
  onClose: () => void;
  onRequestKick: () => void;
  onComposeAction?: (playerUid: string) => void;
}

export function HostPlayerDetailsDialog({
  gameId,
  playerUid,
  player,
  houseNumber,
  assignment,
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

  return createPortal(
    <div
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
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
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#1a1c1e] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#d3b88c]/10 font-mono text-sm font-bold text-[#e6cfa9]">
              {houseNumber}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#9f9990] uppercase">
                Casa {houseNumber}
              </p>
              <h2
                id={titleId}
                className="truncate font-serif text-xl font-semibold text-[#fffaf0]"
              >
                {player.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Fechar detalhes do jogador"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[#9f9990] hover:bg-white/8 hover:text-[#fffaf0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c]"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </header>

        <div className="max-h-[min(75vh,42rem)] space-y-5 overflow-y-auto p-5">
          <section className="grid grid-cols-2 gap-3">
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

          <section className="rounded-xl border border-white/8 bg-black/15 p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#9f9990] uppercase">
              Role
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="font-serif text-lg font-semibold text-[#fffaf0]">
                {roleLabel}
              </p>
              {role && (
                <span className="rounded-full border border-[#d3b88c]/20 px-2 py-0.5 text-xs font-semibold text-[#e6cfa9]">
                  {FACTION_LABELS[role.faction]}
                </span>
              )}
            </div>
            {role?.description && (
              <p className="mt-2 text-sm leading-6 text-[#bdb7ad]">
                {role.description}
              </p>
            )}
          </section>

          {player.isBot && (
            <section className="rounded-xl border border-white/8 bg-black/15 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#9f9990] uppercase">
                <Bot aria-hidden="true" size={14} />
                Nome do bot
              </p>
              <HostBotNameEditor
                gameId={gameId}
                playerUid={playerUid}
                name={player.name}
              />
            </section>
          )}

          <section className="rounded-xl border border-white/8 bg-black/15 p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#9f9990] uppercase">
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

          <button
            type="button"
            onClick={onRequestKick}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#a33843]/35 text-sm font-bold text-[#f0b9bd] hover:bg-[#a33843]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c]"
          >
            <Ban aria-hidden="true" size={17} />
            {player.isBot ? "Remover bot" : "Expulsar jogador"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
