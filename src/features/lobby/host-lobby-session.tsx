"use client";

import { Siren } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { getPlayerEntries } from "@/features/game-state/player-roster";
import { HostGameControlPanel } from "@/features/game-state/host-game-control-panel";
import { HostDayWorkspace } from "@/features/game-state/host-day-workspace";
import { HostHistoryPanel } from "@/features/game-state/host-history-panel";
import { HostInvestigationCalculator } from "@/features/game-state/host-investigation-calculator";
import { HostDiagnostics } from "@/features/game-state/host-diagnostics";
import { HostWinConditionSuggestion } from "@/features/game-state/host-win-condition-suggestion";
import { HostlessAutopilotRunner } from "@/features/game-state/hostless-autopilot-runner";
import { HostlessTableControls } from "@/features/game-state/hostless-table-controls";
import { HostAnnouncementSounds } from "@/features/game-state/announcement-sounds";
import { PlayerGameView } from "@/features/game-state/player-game-view";
import { HostlessTableView } from "@/features/game-state/hostless-table-view";
import { useMirrorMayorReveals } from "@/features/game-state/use-mayor-reveals";
import { useMirrorMafiaTeam } from "@/features/mafia/use-mirror-mafia-team";
import { HostDayAnnouncements } from "@/features/night-actions/host-day-announcements";
import { HostNightWorkspace } from "@/features/night-actions/host-night-workspace";
import { HostVotingPanel } from "@/features/voting/host-voting-panel";
import { HostRoleComposition } from "@/features/roles/host-role-composition";
import { MobileDrawButton, MobileRolePicker, MobileRoleStats } from "@/features/roles/mobile-role-composition";
import { firebasePaths } from "@/lib/firebase/paths";
import { isHostlessGame } from "@/lib/firebase/schema";

import { HostLobbyHeader } from "./host-lobby-header";
import { HostPlayerCountActions, HostPlayerSidebar } from "./host-player-sidebar";
import { LobbySessionNotice } from "./lobby-session-notice";
import { getRestoreHostSessionErrorMessage, RestoreHostSessionError } from "./restore-host-session-error";
import type { RestoredHostSession } from "./restore-host-session";
import { useFirebaseConnection } from "./use-firebase-connection";
import { useRealtimeLobby } from "./use-realtime-lobby";
import { HostNightConsole } from "./host-night-console";
import { PlayModeSelector } from "./play-mode-selector";
import { MobileRoomSettings } from "./mobile-room-settings";
import { DeleteRoomButton } from "./delete-room-button";
import { HostMobileConsole, useIsDesktop, type HostMobileTab, type HostMobileTabId } from "./host-mobile-console";
import { scrollToNightConsoleAction } from "@/features/night-actions/night-console-navigation";

interface HostLobbySessionProps {
    roomCode: string;
}

/** Leva as revelações de Mayor feitas no celular para o status privado, nos dois modos. */
function MayorRevealMirror({ gameId, hostUid }: Readonly<{ gameId: string; hostUid: string }>) {
    useMirrorMayorReveals(gameId, hostUid, true);
    // Mesma lógica de espelho: a Máfia precisa saber quem é da Máfia.
    useMirrorMafiaTeam(gameId, hostUid);
    useMirrorMafiaTeam(gameId, hostUid, "vampire");
    return null;
}

/** Abre os controles da mesa num diálogo; só para emergências no modo só celulares. */
function EmergencyControlsButton({ controls }: Readonly<{ controls: ReactNode }>) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    return (
        <>
            <button
                type="button"
                onClick={() => dialogRef.current?.showModal()}
                className="mt-6 flex min-h-11 items-center gap-2 rounded-xl border border-[#e0cfb4]/40 px-5 text-sm font-semibold text-[#f6dfb5] hover:bg-white/5 focus-visible:outline-3 focus-visible:outline-[#c18b2f]"
            >
                <Siren aria-hidden="true" className="size-4" />
                Controles de emergência
            </button>
            <dialog
                ref={dialogRef}
                onClick={(event) => {
                    if (event.target === event.currentTarget) dialogRef.current?.close();
                }}
                aria-label="Controles de emergência"
                className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-transparent p-0 backdrop:bg-black/70"
            >
                {controls}
                <button type="button" onClick={() => dialogRef.current?.close()} className="mt-3 min-h-11 w-full rounded-xl border border-white/20 bg-[#1c1715] text-sm font-semibold text-[#f6dfb5]">
                    Fechar
                </button>
            </dialog>
        </>
    );
}

/** Fim de jogo no modo só celulares: leva todos de volta ao lobby. */
function ReturnToLobbyButton({ gameId }: Readonly<{ gameId: string }>) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const handleClick = async () => {
        if (busy) return;
        setBusy(true);
        setError(false);
        try {
            const { endGame } = await import("@/features/game-state/end-game");
            await endGame(gameId);
        } catch {
            setError(true);
            setBusy(false);
        }
    };
    return (
        <div>
            <button type="button" disabled={busy} onClick={handleClick} className="btn-primary w-full disabled:opacity-60">
                Voltar todos ao lobby
            </button>
            {error && (
                <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
                    Não foi possível voltar ao lobby. Tente de novo.
                </p>
            )}
        </div>
    );
}

type HostSessionState = { status: "loading" } | { status: "ready"; session: RestoredHostSession } | { status: "error"; message: string };

export function HostLobbySession({ roomCode }: HostLobbySessionProps) {
    const [sessionState, setSessionState] = useState<HostSessionState>({
        status: "loading",
    });
    const [composeActorUid, setComposeActorUid] = useState<string | null>(null);
    const isDesktop = useIsDesktop();
    const [mobileTab, setMobileTab] = useState<HostMobileTabId>("table");
    const [mobilePlayersOpen, setMobilePlayersOpen] = useState(false);
    const session = sessionState.status === "ready" ? sessionState.session : null;
    const lobby = useRealtimeLobby({ gameId: session?.gameId ?? null });
    const connectionStatus = useFirebaseConnection(Boolean(session));
    const gameStarted = lobby.game?.status === "in-progress";
    const lobbyPlayerCount = getPlayerEntries(lobby.players).length;
    const lobbyStatus = lobby.game?.status;

    // Mostra na home quantos jogadores e em que fase está cada sala.
    useEffect(() => {
        if (!session || !lobbyStatus) return;

        void import("@/lib/firebase/realtime-database-repository")
            .then(({ applyAtomicUpdate }) =>
                applyAtomicUpdate({
                    [firebasePaths.openRoomPlayerCount(session.code)]: lobbyPlayerCount,
                    [firebasePaths.openRoomStatus(session.code)]: lobbyStatus,
                }),
            )
            .catch(() => undefined);
    }, [lobbyPlayerCount, lobbyStatus, session]);

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
                  // No celular o console mora na aba da fase, atrás da gaveta de jogadores.
                  setMobilePlayersOpen(false);
                  setMobileTab("phase");
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

    const engine = (
        <>
            <MayorRevealMirror gameId={gameId} hostUid={hostUid} />
            <HostAnnouncementSounds gameId={gameId} game={game} />
            <HostlessAutopilotRunner gameId={gameId} hostUid={hostUid} game={game} players={lobby.players} />
            {nightConsole}
            {game.phase !== "night" && votingPanel}
            {nightWorkspace}
        </>
    );
    const hostPlayer = lobby.players[hostUid];

    // Só celulares: quem criou a sala joga como os outros; o motor roda escondido e os
    // controles da mesa ficam guardados para emergências.
    if (tableOnly && game.playMode === "host-player" && hostPlayer) {
        return (
            <div className="flex flex-col items-center w-full max-w-xl min-w-0 gap-4 px-5 py-8">
                <PlayerGameView
                    gameId={gameId}
                    code={sessionState.session.code}
                    game={game}
                    alive={hostPlayer.alive}
                    players={lobby.players}
                    viewerUid={hostUid}
                    gameOverAction={<ReturnToLobbyButton gameId={gameId} />}
                    footerAction={<EmergencyControlsButton controls={<HostlessTableControls gameId={gameId} game={game} />} />}
                />
                <div hidden aria-hidden="true">
                    {engine}
                </div>
            </div>
        );
    }

    if (tableOnly) {
        return (
            <div className="grid min-w-0 w-full">
                <HostLobbyHeader code={sessionState.session.code} gameId={gameId} game={game} connectionStatus={connectionStatus} updating={lobby.isLoading} />
                <HostlessTableView
                    gameId={gameId}
                    game={game}
                    players={lobby.players}
                    controls={<HostlessTableControls gameId={gameId} game={game} />}
                    engine={engine}
                />
            </div>
        );
    }

    if (!isDesktop) {
        const header = <HostLobbyHeader code={sessionState.session.code} gameId={gameId} game={game} connectionStatus={connectionStatus} updating={lobby.isLoading} />;
        const sidebar = (
            <HostPlayerSidebar
                gameId={gameId}
                verifiedHostUid={hostUid}
                players={lobby.players}
                gameStarted={!compositionEditable}
                statusEditable={game.status === "in-progress"}
                onComposeAction={handleComposeAction}
            />
        );
        const tabs: HostMobileTab[] = compositionEditable
            ? [
                  {
                      id: "players",
                      label: "Jogadores",
                      // A lista vira página inteira: sem o limite de altura da coluna do PC.
                      headerActions: <HostPlayerCountActions gameId={gameId} players={lobby.players} gameStarted={false} />,
                      content: (
                          <HostPlayerSidebar
                              gameId={gameId}
                              verifiedHostUid={hostUid}
                              players={lobby.players}
                              gameStarted={false}
                              statusEditable={false}
                              layout="page"
                          />
                      ),
                  },
                  {
                      id: "roles",
                      label: "Roles",
                      headerActions: <MobileRoleStats gameId={gameId} playerCount={playerCount} />,
                      content: <MobileRolePicker gameId={gameId} playerCount={playerCount} />,
                  },
                  {
                      id: "settings",
                      label: "Sala",
                      headerActions: <DeleteRoomButton gameId={gameId} code={sessionState.session.code} compact />,
                      content: (
                          <MobileRoomSettings
                              code={sessionState.session.code}
                              connectionStatus={connectionStatus}
                              playModeSelector={
                                  <PlayModeSelector
                                      gameId={gameId}
                                      playMode={game.playMode ?? "hosted"}
                                      gamePace={game.gamePace ?? "relaxed"}
                                      code={sessionState.session.code}
                                      hostJoined={Boolean(lobby.players[hostUid])}
                                      unavailableModes={["hostless"]}
                                  />
                              }
                          />
                      ),
                  },
              ]
            : [
                  {
                      id: "table",
                      label: "Mesa",
                      content: (
                          <>
                              {controlPanel}
                              <HostWinConditionSuggestion gameId={gameId} hostUid={hostUid} nightId={game.currentNightId} players={lobby.players} />
                          </>
                      ),
                  },
                  {
                      id: "phase",
                      label: game.phase === "night" ? "Noite" : "Dia",
                      content: (
                          <>
                              {game.currentNightId && nightConsole}
                              {game.phase !== "night" && (
                                  <>
                                      <HostDayAnnouncements gameId={gameId} />
                                      <HostDayWorkspace
                                          gameId={gameId}
                                          hostUid={hostUid}
                                          players={lobby.players}
                                          condemnedPlayerUid={
                                              game.verdictOutcome === "guilty" && game.verdictClosedAt ? game.accusedPlayerUid ?? undefined : undefined
                                          }
                                      />
                                  </>
                              )}
                              {nightWorkspace}
                          </>
                      ),
                  },
                  ...(game.phase !== "night" ? [{ id: "voting" as const, label: "Votação", content: votingPanel }] : []),
                  {
                      id: "history",
                      label: "Histórico",
                      content: <HostHistoryPanel gameId={gameId} hostUid={hostUid} players={lobby.players} />,
                  },
              ];

        return (
            <HostMobileConsole
                code={sessionState.session.code}
                phase={compositionEditable ? undefined : game.phase}
                roundNumber={game.nightNumber ?? 1}
                header={header}
                sidebar={sidebar}
                tabs={tabs}
                floatingAction={compositionEditable && <MobileDrawButton gameId={gameId} playerCount={playerCount} />}
                background={
                    !compositionEditable && (
                        <>
                            <MayorRevealMirror gameId={gameId} hostUid={hostUid} />
                            <HostAnnouncementSounds gameId={gameId} game={game} />
                        </>
                    )
                }
                activeTab={mobileTab}
                onTabChange={setMobileTab}
                playersOpen={mobilePlayersOpen}
                onPlayersOpenChange={setMobilePlayersOpen}
            />
        );
    }

    return (
        <div className="grid min-w-0 w-full">
            <HostLobbyHeader code={sessionState.session.code} gameId={gameId} game={game} connectionStatus={connectionStatus} updating={lobby.isLoading} />
            <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(19rem,24rem)_minmax(0,1fr)]">
                <HostPlayerSidebar
                    gameId={sessionState.session.gameId}
                    verifiedHostUid={sessionState.session.uid}
                    players={lobby.players}
                    gameStarted={!compositionEditable}
                    statusEditable={game.status === "in-progress"}
                    onComposeAction={handleComposeAction}
                />
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 px-4 pt-4 pb-10 lg:pl-0">
                    {compositionEditable ? (
                        <>
                            <HostRoleComposition
                                gameId={gameId}
                                playerCount={playerCount}
                                editable
                                playModeSelector={
                                    <PlayModeSelector
                                        gameId={gameId}
                                        playMode={game.playMode ?? "hosted"}
                                        gamePace={game.gamePace ?? "relaxed"}
                                        code={sessionState.session.code}
                                        hostJoined={Boolean(lobby.players[hostUid])}
                                    />
                                }
                            />
                        </>
                    ) : (
                        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.7fr)]">
                            <div className="space-y-4">
                                <MayorRevealMirror gameId={gameId} hostUid={hostUid} />
                                <HostAnnouncementSounds gameId={gameId} game={game} />
                                {/* Sem noite aberta o console é só um aviso vazio. */}
                                {game.currentNightId && nightConsole}
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

                            {/* O céu da fase fica à vista enquanto o mestre rola os consoles. */}
                            <div className="grid gap-4 xl:sticky xl:top-4">
                                {controlPanel}
                                <HostWinConditionSuggestion gameId={sessionState.session.gameId} hostUid={sessionState.session.uid} nightId={game.currentNightId} players={lobby.players} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
