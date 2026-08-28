"use client";

import { useMemo, useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { getPlayerDeathDetailsByUid } from "@/features/game-state/player-death-details";
import { getPlayerEntries } from "@/features/game-state/player-roster";
import { useHostHistory } from "@/features/game-state/use-host-history";
import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";

import { addBotPlayer } from "./host-bot-actions";
import { HostAddBotButton } from "./host-add-bot-button";
import { updatePlayerHouseOrder } from "./host-player-actions";
import { getHostPlayerSidebarItems } from "./host-player-sidebar-items";
import { HostPlayerSidebarRow } from "./host-player-sidebar-row";
import { HostPlayerSidebarSectionHeader } from "./host-player-sidebar-section-header";

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
    const [addingBot, setAddingBot] = useState(false);
    const [botError, setBotError] = useState(false);
    const privateRoles = useHostRoleAssignments(gameId, verifiedHostUid);
    const history = useHostHistory(gameId, verifiedHostUid);
    const actionHistory = useMemo(() => Object.values(history.actions).flatMap((actions) => Object.values(actions)), [history.actions]);
    const playerNames = useMemo(() => Object.fromEntries(playerEntries.map(([uid, player]) => [uid, player.name])), [playerEntries]);
    const nightNumberById = useMemo(
        () => Object.fromEntries(Object.values(history.sessions).map((session) => [session.id, session.nightNumber])),
        [history.sessions],
    );
    const deathDetailsByPlayer = useMemo(() => getPlayerDeathDetailsByUid({
        events: history.events,
        playerNames,
        resolutions: history.resolutions,
    }), [history.events, history.resolutions, playerNames]);
    const witchInGame = Object.values(privateRoles.assignments).some(({ roleId }) => roleId === "witch");
    const assignedPlayerCount = Object.keys(privateRoles.assignments).length;
    const gamePlayerCount = gameStarted && assignedPlayerCount > 0 ? assignedPlayerCount : playerEntries.length;
    const connectedCount = playerEntries.filter(([, player]) => !player.disconnected).length;
    const playerByUid = useMemo(() => new Map(playerEntries), [playerEntries]);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );
    const optimisticOrderMatchesPlayers = optimisticOrder?.length === incomingOrder.length && optimisticOrder.every((playerUid) => playerByUid.has(playerUid));
    const orderedPlayerUids = optimisticOrderMatchesPlayers ? optimisticOrder : incomingOrder;
    const sidebarItems = getHostPlayerSidebarItems(orderedPlayerUids, playerByUid, gameStarted);
    const reorderEnabled = !gameStarted && playerEntries.length > 1 && !savingOrder;
    const sidebarError = orderError || botError || Boolean(privateRoles.error) || Boolean(history.error);

    const handleAddBot = async () => {
        setAddingBot(true);
        setBotError(false);

        try {
            await addBotPlayer(gameId);
        } catch {
            setBotError(true);
        } finally {
            setAddingBot(false);
        }
    };

    const persistOrderChange = async (previousOrder: string[], nextOrder: string[]) => {
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
        await persistOrderChange(previousOrder, nextOrder);
    };

    const handleMovePlayer = async (playerUid: string, direction: -1 | 1) => {
        if (!reorderEnabled) {
            return;
        }

        const oldIndex = orderedPlayerUids.indexOf(playerUid);
        const newIndex = oldIndex + direction;

        if (oldIndex < 0 || newIndex < 0 || newIndex >= orderedPlayerUids.length) {
            return;
        }

        const previousOrder = orderedPlayerUids;
        const nextOrder = arrayMove(previousOrder, oldIndex, newIndex);
        await persistOrderChange(previousOrder, nextOrder);
    };

    return (
        <aside className="h-[90vh] overflow-y-auto border-r border-white/10 bg-[#1a1c1e] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.3)] lg:sticky lg:top-0">
            <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <p className="text-sm font-semibold tracking-[0.18em] text-[#d3b88c] uppercase">Jogadores</p>
                <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/8 text-sm font-bold text-[#e6cfa9]" aria-label={`${connectedCount} jogadores ativos`}>
                        {connectedCount}
                    </span>
                    <HostAddBotButton disabled={gameStarted} adding={addingBot} onAdd={() => void handleAddBot()} />
                </div>
            </header>

            {playerEntries.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-[#9f9990]">Nenhum jogador na sala.</p>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
                    <SortableContext items={orderedPlayerUids} strategy={verticalListSortingStrategy}>
                        <ul className="mt-4 grid gap-2" aria-live="polite">
                            {sidebarItems.map((item) => {
                                if (item.kind === "living-separator") {
                                    return <HostPlayerSidebarSectionHeader key="living-player-separator" label="Vivos" playerCount={item.livingPlayerCount} />;
                                }

                                if (item.kind === "dead-separator") {
                                    return <HostPlayerSidebarSectionHeader key="dead-player-separator" label="Mortos" playerCount={item.deadPlayerCount} />;
                                }

                                return (
                                    <HostPlayerSidebarRow
                                        key={item.playerUid}
                                        gameId={gameId}
                                        playerUid={item.playerUid}
                                        player={item.player}
                                        playerCount={gamePlayerCount}
                                        houseNumber={item.houseNumber}
                                        assignment={privateRoles.assignments[item.playerUid]}
                                        actionHistory={actionHistory}
                                        actionHistoryLoaded={history.loaded}
                                        nightNumberById={nightNumberById}
                                        playerNames={playerNames}
                                        deathDetails={deathDetailsByPlayer[item.playerUid]}
                                        witchInGame={witchInGame}
                                        rolesLoaded={privateRoles.loaded}
                                        gameStarted={gameStarted}
                                        statusEditable={statusEditable}
                                        reorderEnabled={reorderEnabled}
                                        canMoveUp={item.houseNumber > 1}
                                        canMoveDown={item.houseNumber < orderedPlayerUids.length}
                                        onMove={(direction) => void handleMovePlayer(item.playerUid, direction)}
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
                    : history.error
                      ? "Não foi possível carregar o histórico da partida."
                      : botError
                        ? "Não foi possível adicionar o bot. Tente novamente."
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
