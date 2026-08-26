"use client";

import { useEffect, useState } from "react";

import { getConnectedPlayerEntries } from "@/features/game-state/player-roster";
import { HostGameControlPanel } from "@/features/game-state/host-game-control-panel";
import { HostHistoryPanel } from "@/features/game-state/host-history-panel";
import { HostInvestigationCalculator } from "@/features/game-state/host-investigation-calculator";
import { HostDiagnostics } from "@/features/game-state/host-diagnostics";
import { HostWinConditionSuggestion } from "@/features/game-state/host-win-condition-suggestion";
import { HostNightWorkspace } from "@/features/night-actions/host-night-workspace";
import { HostRoleComposition } from "@/features/roles/host-role-composition";

import { HostLobbyHeader } from "./host-lobby-header";
import { HostPlayerSidebar } from "./host-player-sidebar";
import { LobbySessionNotice } from "./lobby-session-notice";
import {
  getRestoreHostSessionErrorMessage,
  RestoreHostSessionError,
} from "./restore-host-session-error";
import type { RestoredHostSession } from "./restore-host-session";
import { useFirebaseConnection } from "./use-firebase-connection";
import { useRealtimeLobby } from "./use-realtime-lobby";

interface HostLobbySessionProps {
  roomCode: string;
}

type HostSessionState =
  | { status: "loading" }
  | { status: "ready"; session: RestoredHostSession }
  | { status: "error"; message: string };

export function HostLobbySession({ roomCode }: HostLobbySessionProps) {
  const [sessionState, setSessionState] = useState<HostSessionState>({
    status: "loading",
  });
  const [composeActorUid, setComposeActorUid] = useState<string | null>(null);
  const session =
    sessionState.status === "ready" ? sessionState.session : null;
  const lobby = useRealtimeLobby({ gameId: session?.gameId ?? null });
  const connectionStatus = useFirebaseConnection(Boolean(session));

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

        const message =
          error instanceof RestoreHostSessionError
            ? getRestoreHostSessionErrorMessage(error)
            : "Não foi possível restaurar o lobby do mestre.";
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
  const playerCount = getConnectedPlayerEntries(lobby.players).length;
  const compositionEditable =
    game.status === "lobby" && game.phase === "lobby";
  const handleComposeAction = game.phase === "night"
    ? (playerUid: string) => {
        setComposeActorUid(playerUid);
        document.getElementById("host-night-workspace")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    : undefined;

  return (
    <div className="grid min-w-0 w-full">
      <HostLobbyHeader
        code={sessionState.session.code}
        game={game}
        connectionStatus={connectionStatus}
        updating={lobby.isLoading}
      />
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
            <HostRoleComposition
              gameId={sessionState.session.gameId}
              playerCount={playerCount}
              editable
            />
          ) : (
            <>
              <HostGameControlPanel
                gameId={sessionState.session.gameId}
                game={game}
              />
              {game.phase === "night" && game.currentNightId && (
                <HostNightWorkspace
                  gameId={sessionState.session.gameId}
                  nightId={game.currentNightId}
                  nightNumber={game.nightNumber ?? 1}
                  hostUid={sessionState.session.uid}
                  players={lobby.players}
                  externalSelectedActorUid={composeActorUid}
                />
              )}
              <HostWinConditionSuggestion
                gameId={sessionState.session.gameId}
                hostUid={sessionState.session.uid}
                nightId={game.currentNightId}
                players={lobby.players}
              />
              <HostHistoryPanel
                gameId={sessionState.session.gameId}
                hostUid={sessionState.session.uid}
                players={lobby.players}
              />
              <HostInvestigationCalculator />
              <HostDiagnostics
                gameId={sessionState.session.gameId}
                roomCode={sessionState.session.code}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
