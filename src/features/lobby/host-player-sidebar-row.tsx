"use client";

import { useState } from "react";
import { Bot, ChevronRight, FaceSlightlySmiling, Heart, Skull } from "lucide-react";

import { getRoleById } from "@/data/roles";
import type { PrivatePlayerRecord, PublicPlayerRecord } from "@/lib/firebase/schema";

import { HostPlayerDetailsDialog } from "./host-player-details-dialog";
import { kickPlayerFromGame } from "./host-player-actions";
import { HostPlayerRemovalDialog } from "./host-player-removal-dialog";
import { FACTION_STYLES } from "../roles/role-selection-options";

interface HostPlayerSidebarRowProps {
    gameId: string;
    playerUid: string;
    player: PublicPlayerRecord;
    houseNumber: number;
    assignment?: PrivatePlayerRecord;
    rolesLoaded: boolean;
    gameStarted: boolean;
    statusEditable: boolean;
    onComposeAction?: (playerUid: string) => void;
}

export function HostPlayerSidebarRow({ gameId, playerUid, player, houseNumber, assignment, rolesLoaded, gameStarted, statusEditable, onComposeAction }: HostPlayerSidebarRowProps) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [confirmingKick, setConfirmingKick] = useState(false);
    const [kicking, setKicking] = useState(false);
    const [kickError, setKickError] = useState(false);
    const role = assignment ? getRoleById(assignment.roleId) : undefined;
    const roleLabel = assignment ? (role?.name ?? "Role não reconhecida") : rolesLoaded ? "Role não atribuída" : "Carregando role…";
    const style = role ? FACTION_STYLES[role.faction] : FACTION_STYLES.neutral;

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

    return (
        <li className={player.disconnected ? "opacity-60" : undefined}>
            <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                aria-label={`Abrir detalhes de ${player.name}, casa ${houseNumber}`}
                className="group p-1.5 w-full flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 text-left transition hover:border-[#d3b88c]/35 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c]"
            >
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-[#d3b88c]/10 font-mono text-sm font-bold text-[#e6cfa9]">{houseNumber}</span>

                    <span className="flex items-center gap-1">
                      {Boolean(player.isBot) ? <Bot size={16} className="text-[#9f9990]" /> : null}
                        <span className="truncate text-sm font-medium text-[#fffaf0]">{player.name}</span>
                        <span className={`ml-1 w-fit max-w-full truncate rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium text-[#e6cfa9] ${style.tag} `}>{roleLabel}</span>
                    </span>
                </div>

                <span className="flex items-center gap-1">
                    <span className={`rounded-full text-[0.6875rem] font-bold ${player.alive ? " text-[#bfe0c5]" : "bg-[#a33843]/15 text-[#f0b9bd]"}`}>
                        {player.alive ? <Heart size={18} /> : <Skull aria-hidden="true" size={18} className="inline-block" />}
                    </span>
                    <ChevronRight aria-hidden="true" size={16} className="text-[#756f68] transition group-hover:translate-x-0.5 group-hover:text-[#d3b88c]" />
                </span>
            </button>

            <HostPlayerDetailsDialog
                gameId={gameId}
                playerUid={playerUid}
                player={player}
                houseNumber={houseNumber}
                assignment={assignment}
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
        </li>
    );
}
