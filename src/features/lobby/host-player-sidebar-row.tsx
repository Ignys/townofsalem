"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bot, ChevronDown, ChevronRight, ChevronUp, GripVertical, Heart, Skull } from "lucide-react";

import { getRoleById } from "@/data/roles";
import type { PlayerDeathDetails } from "@/features/game-state/player-death-details";
import type { PrivatePlayerRecord, PublicPlayerRecord } from "@/lib/firebase/schema";
import type { HostNightActionEntry } from "@/types";

import { FACTION_STYLES } from "../roles/role-selection-options";
import { HostPlayerDetailsDialog } from "./host-player-details-dialog";
import { kickPlayerFromGame } from "./host-player-actions";
import { HostPlayerRemovalDialog } from "./host-player-removal-dialog";

interface HostPlayerSidebarRowProps {
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
    witchInGame: boolean;
    rolesLoaded: boolean;
    gameStarted: boolean;
    statusEditable: boolean;
    reorderEnabled: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMove: (direction: -1 | 1) => void;
    /** "page": linha sem card da aba Jogadores do celular, alça à direita. */
    layout?: "panel" | "page";
    onComposeAction?: (playerUid: string) => void;
}

const reorderButtonClassName =
    "flex min-h-5 w-full touch-none items-center justify-center text-[#d3b88c] transition-colors hover:bg-white/8 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#d3b88c] disabled:cursor-default disabled:text-[#756f68] disabled:hover:bg-transparent";

export function HostPlayerSidebarRow({
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
    witchInGame,
    rolesLoaded,
    gameStarted,
    statusEditable,
    reorderEnabled,
    canMoveUp,
    canMoveDown,
    onMove,
    layout = "panel",
    onComposeAction,
}: HostPlayerSidebarRowProps) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [confirmingKick, setConfirmingKick] = useState(false);
    const [kicking, setKicking] = useState(false);
    const [kickError, setKickError] = useState(false);
    const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform: sortableTransform, transition } = useSortable({ id: playerUid, disabled: !reorderEnabled });
    const role = assignment ? getRoleById(assignment.roleId) : undefined;
    const roleLabel = assignment ? (role?.name ?? "Role não reconhecida") : rolesLoaded ? "Role não atribuída" : "Carregando role…";
    const style = role ? FACTION_STYLES[role.faction] : FACTION_STYLES.neutral;
    const cursedByWitch = witchInGame && Boolean(assignment?.statuses?.cursed);
    const transform = CSS.Transform.toString(sortableTransform);

    const requestKick = () => {
        setDetailsOpen(false);
        setConfirmingKick(true);
    };

    const cancelKick = () => {
        setConfirmingKick(false);
        setKickError(false);
        setDetailsOpen(true);
    };

    const handleKick = async () => {
        setKicking(true);
        setKickError(false);

        try {
            await kickPlayerFromGame(gameId, playerUid);
        } catch {
            setKickError(true);
            setKicking(false);
        }
    };

    const dialogs = (
        <>
            <HostPlayerDetailsDialog
                gameId={gameId}
                playerUid={playerUid}
                player={player}
                playerCount={playerCount}
                houseNumber={houseNumber}
                assignment={assignment}
                actionHistory={actionHistory}
                actionHistoryLoaded={actionHistoryLoaded}
                nightNumberById={nightNumberById}
                playerNames={playerNames}
                deathDetails={deathDetails}
                role={role}
                roleLabel={roleLabel}
                gameStarted={gameStarted}
                statusEditable={statusEditable}
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                onRequestKick={requestKick}
                onComposeAction={onComposeAction}
            />

            <HostPlayerRemovalDialog
                playerName={player.name}
                isBot={Boolean(player.isBot)}
                open={confirmingKick}
                busy={kicking}
                error={kickError}
                onCancel={cancelKick}
                onConfirm={() => void handleKick()}
            />
        </>
    );

    if (layout === "page") {
        const status = player.isBot ? { label: "Bot", dot: "bg-[#8d877e]" } : player.disconnected ? { label: "Desconectado", dot: "bg-[#a33843]" } : { label: "Conectado", dot: "bg-[#6f9b77]" };
        return (
            <li
                ref={setNodeRef}
                style={{ transform, transition }}
                className={`flex items-center gap-1 border-b border-white/7 transition-colors last:border-b-0 ${
                    isDragging ? "relative z-10 rounded-2xl border-transparent bg-[#1d1f23] shadow-[0_16px_40px_rgba(0,0,0,0.5)] ring-1 ring-[#d3b88c]/50" : ""
                } ${player.disconnected ? "opacity-60" : ""}`}
            >
                <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    aria-label={`Abrir detalhes de ${player.name}, casa ${houseNumber}`}
                    className="flex min-h-16 min-w-0 flex-1 items-center gap-3.5 rounded-xl py-2 pr-1 text-left transition-colors active:bg-white/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#d3b88c]"
                >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#d3b88c]/30 bg-[#d3b88c]/[0.07] font-serif text-lg font-semibold text-[#f6dfb5] tabular-nums">
                        {houseNumber}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                            {Boolean(player.isBot) && <Bot aria-hidden="true" size={15} className="shrink-0 text-[#9f9990]" />}
                            <span className="truncate text-[15px] font-semibold text-[#fffaf0]">{player.name}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[#8d877e]">
                            <span aria-hidden="true" className={`size-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                        </span>
                    </span>
                    <ChevronRight aria-hidden="true" size={16} className="shrink-0 text-[#5f5a54]" />
                </button>
                {!gameStarted && (
                    <button
                        type="button"
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                        disabled={!reorderEnabled}
                        aria-label={`Arrastar ${player.name} para outra casa`}
                        className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-[#8d877e] transition-colors active:cursor-grabbing active:bg-white/[0.06] active:text-[#d3b88c] focus-visible:outline-2 focus-visible:outline-[#d3b88c] disabled:opacity-30"
                    >
                        <GripVertical aria-hidden="true" size={18} />
                    </button>
                )}
                {dialogs}
            </li>
        );
    }

    return (
        <li
            ref={setNodeRef}
            style={{ transform, transition }}
            className={`flex overflow-hidden rounded-2xl border bg-white/[0.03] transition-colors ${
                isDragging ? "z-10 border-[#d3b88c]/60 shadow-xl" : "border-white/8"
            } ${player.disconnected ? "opacity-60" : ""}`}
        >
            {!gameStarted && (
                <div className={`grid shrink-0 divide-x divide-white/10 border-r border-white/10 bg-white/[0.03] w-12 grid-cols-2`}>
                    {(<div className="grid grid-rows-2 divide-y divide-white/10">
                        <button
                            type="button"
                            onClick={() => onMove(-1)}
                            disabled={!reorderEnabled || !canMoveUp}
                            aria-label={`Mover ${player.name} uma casa para cima`}
                            className={reorderButtonClassName}
                        >
                            <ChevronUp aria-hidden="true" size={16} strokeWidth={2} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onMove(1)}
                            disabled={!reorderEnabled || !canMoveDown}
                            aria-label={`Mover ${player.name} uma casa para baixo`}
                            className={reorderButtonClassName}
                        >
                            <ChevronDown aria-hidden="true" size={16} strokeWidth={2} />
                        </button>
                    </div>)}
                    <button
                        type="button"
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                        disabled={!reorderEnabled}
                        aria-label={`Arrastar ${player.name} para outra casa`}
                        className={`${reorderButtonClassName} cursor-grab touch-none active:cursor-grabbing`}
                    >
                        <GripVertical aria-hidden="true" size={16} strokeWidth={2} />
                    </button>
                </div>
            )}

            <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                aria-label={`Abrir detalhes de ${player.name}, casa ${houseNumber}`}
                className="group flex min-w-0 flex-1 items-center justify-between gap-2 p-1.5 text-left transition hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#d3b88c]"
            >
                <span className="flex min-w-0 items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d3b88c]/10 font-mono text-sm font-bold text-[#e6cfa9]">{houseNumber}</span>

                    <span className="flex min-w-0 items-center gap-1">
                        {Boolean(player.isBot) && <Bot size={16} className="shrink-0 text-[#9f9990]" />}
                        <span className="truncate text-sm font-medium text-[#fffaf0]">{player.name}</span>
                        {gameStarted && <span className={`ml-1 w-fit max-w-full truncate rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium text-[#e6cfa9] ${style.tag}`}>{roleLabel}</span>}
                    </span>
                </span>

                <span className="flex shrink-0 items-center gap-1">
                    {gameStarted && (
                        <span className={`rounded-full text-[0.6875rem] font-bold ${player.alive ? (cursedByWitch ? "text-[#8000ff]" : "text-[#bfe0c5]") : "text-[#f0b9bd]"}`}>
                            {player.alive ? (
                                <Heart fill={`${cursedByWitch && "#8000ff"}`} aria-label={cursedByWitch ? "Vivo e amaldiçoado pela Witch" : "Vivo"} size={18} />
                            ) : (
                                <Skull aria-label="Morto" size={18} />
                            )}
                        </span>
                    )}
                    <ChevronRight aria-hidden="true" size={16} className="text-[#756f68] transition group-hover:translate-x-0.5 group-hover:text-[#d3b88c]" />
                </span>
            </button>

            {dialogs}
        </li>
    );
}
