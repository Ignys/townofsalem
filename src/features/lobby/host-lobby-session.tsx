"use client";

import { useEffect, useState } from "react";

import { getPlayerEntries } from "@/features/game-state/player-roster";
import { HostGameControlPanel } from "@/features/game-state/host-game-control-panel";
import { HostDayWorkspace } from "@/features/game-state/host-day-workspace";
import { HostHistoryPanel } from "@/features/game-state/host-history-panel";
import { HostInvestigationCalculator } from "@/features/game-state/host-investigation-calculator";
import { HostDiagnostics } from "@/features/game-state/host-diagnostics";
import { HostWinConditionSuggestion } from "@/features/game-state/host-win-condition-suggestion";
import { HostlessAutopilotRunner } from "@/features/game-state/hostless-autopilot-runner";
import { HostlessTableControls } from "@/features/game-state/hostless-table-controls";
import { HostlessTableView } from "@/features/game-state/hostless-table-view";
import { HostDayAnnouncements } from "@/features/night-actions/host-day-announcements";
import { HostNightWorkspace } from "@/features/night-actions/host-night-workspace";
import { HostVotingPanel } from "@/features/voting/host-voting-panel";
import { HostRoleComposition } from "@/features/roles/host-role-composition";
import { isHostlessGame } from "@/lib/firebase/schema";

import { HostLobbyHeader } from "./host-lobby-header";
import { HostPlayerSidebar } from "./host-player-sidebar";
import { LobbySessionNotice } from "./lobby-session-notice";
import { getRestoreHostSessionErrorMessage, RestoreHostSessionError } from "./restore-host-session-error";
import type { RestoredHostSession } from "./restore-host-session";
import { useFirebaseConnection } from "./use-firebase-connection";
import { useRealtimeLobby } from "./use-realtime-lobby";
import { HostNightConsole } from "./host-night-console";
import { PlayModeSelector } from "./play-mode-selector";
import { scrollToNightConsoleAction } from "@/features/night-actions/night-console-navigation";

interface HostLobbySessionProps {
    roomCode: string;
}

type HostSessionState = { status: "loading" } | { status: "ready"; session: RestoredHostSession } | { status: "error"; message: string };

export function HostLobbySession({ roomCode }: HostLobbySessionProps) {
    const [sessionState, setSessionState] = useState<HostSessionState>({
        status: "loading",
    });
    const [composeActorUid, setComposeActorUid] = useState<string | null>(null);
    const session = sessionState.status === "ready" ? sessionState.session : null;
    const lobby = useRealtimeLobby({ gameId: session?.gameId ?? null });
    const connectionStatus = useFirebaseConnection(Boolean(session));
    const gameStarted = lobby.game?.status === "in-progress";

    // Deaths recorded before the graveyard shipped left no tombstone, so the
    // host buries them once the console is open and can read every role.
    useEffect(() => {
        if (!session?.gameId || !gameStarted) return;

        void import("@/features/game-state/backfill-graveyard")
            .then(({ backfillGraveyard }) => backfillGraveyard(session.gameId))
            .catch(() => undefined);
    }, [gameStarted, session?.gameId]);

    useEffect(() => {
        let active = true;

        void import("./restore-host-session")
            .then(({ restoreHostSession }) => restoreHostSession(roomCode))
            .then((restoredSession) => {
                if (active) {
                    setSessionState({ status: "ready", session: restoredSession });
                }
            })
            .catch((error: unknown) => {
                if (!active) {
                    return;
                }

                const message = error instanceof RestoreHostSessionError ? getRestoreHostSessionErrorMessage(error) : "Não foi possível restaurar o lobby do mestre.";
                setSessionState({ status: "error", message });
            });

        return () => {
            active = false;
        };
    }, [roomCode]);

    if (sessionState.status === "loading") {
        return <LobbySessionNotice loading message="Carregando o lobby…" />;
    }

    if (sessionState.status === "error") {
        return <LobbySessionNotice message={sessionState.message} />;
    }

    if (lobby.gameLoaded && !lobby.game) {
        return <LobbySessionNotice message="Esta partida não existe mais." />;
    }

    if (lobby.error) {
        return <LobbySessionNotice message="Não foi possível acompanhar o lobby." />;
    }

    const game = lobby.game ?? sessionState.session.game;
    const playerCount = getPlayerEntries(lobby.players).length;
    const compositionEditable = game.status === "lobby" && game.phase === "lobby";
    // Sem mestre, depois do sorteio o computador é só a mesa: nada de roles na tela.
    const tableOnly = isHostlessGame(game) && !compositionEditable;
    const handleComposeAction =
        game.phase === "night"
            ? (playerUid: string) => {
                  setComposeActorUid(playerUid);
                  requestAnimationFrame(() => scrollToNightConsoleAction(playerUid));
              }
            : undefined;

    const gameId = sessionState.session.gameId;
    const hostUid = sessionState.session.uid;
    const nightConsole = (
        <HostNightConsole
            gameId={gameId}
            nightId={game.currentNightId}
            nightNumber={game.nightNumber ?? 1}
            hostUid={hostUid}
            players={lobby.players}
            externalSelectedActorUid={composeActorUid}
        />
    );
    const votingPanel = (
        <HostVotingPanel gameId={gameId} verifiedHostUid={hostUid} game={game} players={lobby.players} />
    );
    const nightWorkspace = game.phase === "night" && game.currentNightId && (
        <HostNightWorkspace
            gameId={gameId}
            nightId={game.currentNightId}
            nightNumber={game.nightNumber ?? 1}
            hostUid={hostUid}
            players={lobby.players}
        />
    );
    const controlPanel = <HostGameControlPanel gameId={gameId} game={game} />;

    if (tableOnly) {
        return (
            <div className="grid min-w-0 w-full">
                <HostLobbyHeader code={sessionState.session.code} game={game} connectionStatus={connectionStatus} updating={lobby.isLoading} />
                <HostlessTableView
                    gameId={gameId}
                    game={game}
                    players={lobby.players}
                    controls={<HostlessTableControls gameId={gameId} game={game} />}
                    engine={
                        <>
                            <HostlessAutopilotRunner gameId={gameId} game={game} players={lobby.players} />
                            {nightConsole}
                            {game.phase !== "night" && votingPanel}
                            {nightWorkspace}
                        </>
                    }
                />
            </div>
        );
    }

    return (
        <div className="grid min-w-0 w-full">
            <HostLobbyHeader code={sessionState.session.code} game={game} connectionStatus={connectionStatus} updating={lobby.isLoading} />
            <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(19rem,24rem)_minmax(0,1fr)]">
                <HostPlayerSidebar
                    gameId={sessionState.session.gameId}
                    verifiedHostUid={sessionState.session.uid}
                    players={lobby.players}
                    gameStarted={!compositionEditable}
                    statusEditable={game.status === "in-progress"}
                    onComposeAction={handleComposeAction}
                />
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 mt-4">
                    {compositionEditable ? (
                        <>
                            <PlayModeSelector gameId={gameId} playMode={game.playMode ?? "hosted"} />
                            <HostRoleComposition gameId={gameId} playerCount={playerCount} editable />
                        </>
                    ) : (
                        <div className="pr-4 p-1 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.7fr)]">
                            <div className="space-y-4">
                                {nightConsole}
                                {game.phase !== "night" && (
                                    <>
                                        <HostDayAnnouncements gameId={sessionState.session.gameId} />
                                        {votingPanel}
                                        <HostDayWorkspace
                                            gameId={sessionState.session.gameId}
                                            hostUid={sessionState.session.uid}
                                            players={lobby.players}
                                            condemnedPlayerUid={
                                                game.verdictOutcome === "guilty" && game.verdictClosedAt
                                                    ? game.accusedPlayerUid ?? undefined
                                                    : undefined
                                            }
                                        />
                                    </>
                                )}
                                {nightWorkspace}
                                <HostHistoryPanel gameId={sessionState.session.gameId} hostUid={sessionState.session.uid} players={lobby.players} />
                            </div>

                            {controlPanel}
                            <HostWinConditionSuggestion gameId={sessionState.session.gameId} hostUid={sessionState.session.uid} nightId={game.currentNightId} players={lobby.players} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
