"use client";

import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import { useMemo } from "react";
import { HostConsoleFrame } from "@/components/host/host-console-frame";
import { useHostRoleAssignments } from "../roles/use-host-role-assignments";
import type { Player } from "@/types/player";
import { ROLE_DEFINITIONS } from "@/data/roles";
import { useHostNightLog } from "@/features/night-actions/use-host-night-log";
import { useGameVariants } from "@/features/game-variants/use-game-variants";

import { HostNightConsoleRow } from "./host-night-console-row";
import { HostDeputyPromotionNotice } from "./host-deputy-promotion-notice";
import { getLatestNightConsoleEntry, getNightConsoleInteractions } from "./night-console-interactions";

export interface HostNightConsoleProps {
    gameId: string;
    nightId?: string | null;
    nightNumber: number;
    hostUid: string;
    players: Readonly<Record<string, PublicPlayerRecord>>;
    externalSelectedActorUid?: string | null;
}

export function HostNightConsole({ gameId, nightId, nightNumber, hostUid, players: playerRecords, externalSelectedActorUid }: HostNightConsoleProps) {
    return nightId ? (
        <ActiveHostNightConsole
            key={nightId}
            gameId={gameId}
            nightId={nightId}
            nightNumber={nightNumber}
            hostUid={hostUid}
            players={playerRecords}
            externalSelectedActorUid={externalSelectedActorUid}
        />
    ) : (
        <HostConsoleFrame title="Console do Mestre" id="host-night-console" className="pb-2" contentClassName="mt-2 flex flex-col gap-1">
            <p className="py-6 text-center text-sm text-zinc-500">O console estará disponível durante a noite.</p>
        </HostConsoleFrame>
    );
}

type ActiveHostNightConsoleProps = Omit<HostNightConsoleProps, "nightId"> & { nightId: string };

function ActiveHostNightConsole({ gameId, nightId, nightNumber, hostUid, players: playerRecords, externalSelectedActorUid }: ActiveHostNightConsoleProps) {
    const privateRoles = useHostRoleAssignments(gameId, hostUid);
    const nightLog = useHostNightLog(gameId, nightId, hostUid);
    const gameVariants = useGameVariants(gameId);
    const players = useMemo<Player[]>(() => Object.entries(playerRecords).map(([uid, player]) => ({
        id: uid,
        uid,
        ...player,
        statuses: Object.values(privateRoles.assignments[uid]?.statuses ?? {}),
        originalRoleId: privateRoles.assignments[uid]?.originalRoleId,
    })), [playerRecords, privateRoles.assignments]);
    const assignments = useMemo(() => Object.fromEntries(Object.entries(privateRoles.assignments).map(([uid, assignment]) => [uid, assignment.roleId])), [privateRoles.assignments]);
    const interactions = useMemo(() => {
        const rows = getNightConsoleInteractions(
            players,
            assignments,
            ROLE_DEFINITIONS,
            nightNumber,
            gameVariants.variants,
        );

        return externalSelectedActorUid
            ? [...rows].sort((left, right) => Number(right.actor.uid === externalSelectedActorUid) - Number(left.actor.uid === externalSelectedActorUid))
            : rows;
    }, [assignments, externalSelectedActorUid, gameVariants.variants, nightNumber, players]);

    const entries = Object.values(nightLog.actions);
    const actionHistory = Object.values(nightLog.allActions).flatMap((actions) => Object.values(actions));
    const locked = Boolean(nightLog.session?.resolutionAppliedAt && !nightLog.session.rolledBackAt);

    if (!privateRoles.loaded || !nightLog.loaded) {
        return (
            <HostConsoleFrame title="Console do Mestre" id="host-night-console" className="pb-2" contentClassName="mt-2 flex flex-col gap-1">
                <p role="status" className="py-6 text-center text-sm text-zinc-400">Carregando interações…</p>
            </HostConsoleFrame>
        );
    }

    if (privateRoles.error || nightLog.error) {
        return (
            <HostConsoleFrame title="Console do Mestre" id="host-night-console" className="pb-2" contentClassName="mt-2 flex flex-col gap-1">
                <p role="alert" className="py-6 text-center text-sm text-red-300">Não foi possível carregar as roles.</p>
            </HostConsoleFrame>
        );
    }

    return (
        <HostConsoleFrame title="Console do Mestre" id="host-night-console" className="pb-2" contentClassName="mt-2 flex flex-col gap-1">
            <HostDeputyPromotionNotice
                promotion={nightLog.session?.deputyPromotion}
                players={playerRecords}
            />
            {interactions.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">Nenhuma role possui interação nesta noite.</p>
            ) : interactions.map((interaction) => {
                const existingEntry = getLatestNightConsoleEntry(interaction, entries);

                return (
                    <HostNightConsoleRow
                        key={interaction.id}
                        gameId={gameId}
                        nightId={nightId}
                        nightNumber={nightNumber}
                        interaction={interaction}
                        players={players}
                        assignments={assignments}
                        existingEntry={existingEntry}
                        actionHistory={actionHistory}
                        locked={locked}
                        variants={gameVariants.variants}
                    />
                );
            })}
        </HostConsoleFrame>
    );
}
