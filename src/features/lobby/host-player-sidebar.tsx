"use client";

import { useMemo, useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { getPlayerEntries } from "@/features/game-state/player-roster";
import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";

import { updatePlayerHouseOrder } from "./host-player-actions";
import { HostPlayerSidebarRow } from "./host-player-sidebar-row";

interface HostPlayerSidebarProps {
    gameId: string;
    verifiedHostUid: string;
    players: Record<string, PublicPlayerRecord>;
    gameStarted: boolean;
    statusEditable: boolean;
    onComposeAction?: (playerUid: string) => void;
}

export function HostPlayerSidebar({ gameId, verifiedHostUid, players, gameStarted, statusEditable, onComposeAction }: HostPlayerSidebarProps) {
    const playerEntries = useMemo(() => getPlayerEntries(players), [players]);
    const incomingOrder = useMemo(() => playerEntries.map(([playerUid]) => playerUid), [playerEntries]);
    const [optimisticOrder, setOptimisticOrder] = useState<string[] | null>(null);
    const [savingOrder, setSavingOrder] = useState(false);
    const [orderError, setOrderError] = useState(false);
    const privateRoles = useHostRoleAssignments(gameId, verifiedHostUid);
    const connectedCount = playerEntries.filter(([, player]) => !player.disconnected).length;
    const playerByUid = useMemo(() => new Map(playerEntries), [playerEntries]);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const optimisticOrderMatchesPlayers = optimisticOrder?.length === incomingOrder.length && optimisticOrder.every((playerUid) => playerByUid.has(playerUid));
    const orderedPlayerUids = optimisticOrderMatchesPlayers ? optimisticOrder : incomingOrder;
    const reorderEnabled = !gameStarted && playerEntries.length > 1 && !savingOrder;
    const sidebarError = orderError || Boolean(privateRoles.error);

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id || !reorderEnabled) {
            return;
        }

        const oldIndex = orderedPlayerUids.indexOf(String(active.id));
        const newIndex = orderedPlayerUids.indexOf(String(over.id));

        if (oldIndex < 0 || newIndex < 0) {
            return;
        }

        const previousOrder = orderedPlayerUids;
        const nextOrder = arrayMove(previousOrder, oldIndex, newIndex);
        setOptimisticOrder(nextOrder);
        setSavingOrder(true);
        setOrderError(false);

        try {
            await updatePlayerHouseOrder(gameId, nextOrder);
        } catch {
            setOptimisticOrder(previousOrder);
            setOrderError(true);
        } finally {
            setSavingOrder(false);
        }
    };

    return (
        <aside className="h-[100vh] border-r border-white/10 bg-[#1a1c1e] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] lg:sticky lg:top-0">
            <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <p className="text-sm font-semibold tracking-[0.18em] text-[#d3b88c] uppercase">seus Jogadores</p>
                <span className="rounded-full bg-white/8 px-3 py-1 text-sm font-bold text-[#e6cfa9]">{connectedCount}</span>
            </header>

            {!gameStarted && playerEntries.length > 1 && <p className="mt-4 text-xs leading-5 text-[#9f9990]">Arraste os jogadores para definir o número de cada casa.</p>}

            {playerEntries.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-[#9f9990]">Nenhum jogador na sala.</p>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
                    <SortableContext items={orderedPlayerUids} strategy={verticalListSortingStrategy}>
                        <ul className="mt-4 grid gap-2" aria-live="polite">
                            {orderedPlayerUids.map((playerUid, index) => {
                                const player = playerByUid.get(playerUid);

                                if (!player) {
                                    return null;
                                }

                                return (
                                    <HostPlayerSidebarRow
                                        key={playerUid}
                                        gameId={gameId}
                                        playerUid={playerUid}
                                        player={player}
                                        houseNumber={index + 1}
                                        assignment={privateRoles.assignments[playerUid]}
                                        rolesLoaded={privateRoles.loaded}
                                        gameStarted={gameStarted}
                                        statusEditable={statusEditable}
                                        reorderEnabled={reorderEnabled}
                                        onComposeAction={onComposeAction}
                                    />
                                );
                            })}
                        </ul>
                    </SortableContext>
                </DndContext>
            )}

            <p role={sidebarError ? "alert" : "status"} aria-live="polite" className={`mt-4 min-h-5 text-xs ${sidebarError ? "text-[#f0b9bd]" : "text-[#9f9990]"}`}>
                {privateRoles.error
                    ? "Não foi possível carregar as roles dos jogadores."
                    : orderError
                      ? "Não foi possível salvar a ordem. Tente novamente."
                      : savingOrder
                        ? "Salvando ordem das casas…"
                        : gameStarted && !privateRoles.loaded
                          ? "Carregando roles…"
                          : ""}
            </p>
        </aside>
    );
}
