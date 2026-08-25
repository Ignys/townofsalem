"use client";

import { useEffect, useState } from "react";

import { LobbySessionNotice } from "@/features/lobby/lobby-session-notice";
import { RealtimeLobbyView } from "@/features/lobby/realtime-lobby-view";
import type { FirebaseConnectionStatus } from "@/features/lobby/use-firebase-connection";
import { useRealtimeLobby } from "@/features/lobby/use-realtime-lobby";

import {
  getRestorePlayerSessionErrorMessage,
  RestorePlayerSessionError,
} from "./restore-player-session-error";
import type { RestoredPlayerSession } from "./restore-player-session";
import { PlayerRoleView } from "./player-role-view";

interface PlayerGameSessionProps {
  roomCode: string;
}

type PlayerSessionState =
  | { status: "loading" }
  | { status: "ready"; session: RestoredPlayerSession }
  | { status: "removed" }
  | { status: "missing" }
  | { status: "error"; message: string };

function stateFromRestorationError(error: unknown): PlayerSessionState {
  if (error instanceof RestorePlayerSessionError) {
    if (error.code === "player-removed") {
      return { status: "removed" };
    }

    if (error.code === "invalid-code" || error.code === "game-not-found") {
      return { status: "missing" };
    }
  }

  return {
    status: "error",
    message: getRestorePlayerSessionErrorMessage(error),
  };
}

export function PlayerGameSession({ roomCode }: PlayerGameSessionProps) {
  const [sessionState, setSessionState] = useState<PlayerSessionState>({
    status: "loading",
  });
  const [connectionStatus, setConnectionStatus] =
    useState<FirebaseConnectionStatus>("connecting");
  const restoredSession =
    sessionState.status === "ready" ? sessionState.session : null;
  const lobby = useRealtimeLobby({
    gameId: restoredSession?.gameId ?? null,
    playerUid: restoredSession?.uid,
  });

  useEffect(() => {
    let active = true;
    const unsubscribers: Array<() => void> = [];

    void (async () => {
      try {
        const { restorePlayerSession } = await import(
          "./restore-player-session"
        );
        const session = await restorePlayerSession(roomCode);

        if (!active) {
          return;
        }

        setSessionState({ status: "ready", session });

        const connectionRepository = await import(
          "@/lib/firebase/player-connection-repository"
        );

        if (!active) {
          return;
        }

        unsubscribers.push(
          connectionRepository.trackPlayerConnection(
            session.gameId,
            session.uid,
            {
              onConnectionChange: (connected) => {
                if (active) {
                  setConnectionStatus(
                    connected ? "connected" : "reconnecting",
                  );
                }
              },
              onError: () => {
                if (active) {
                  setConnectionStatus("unavailable");
                }
              },
            },
          ),
        );
      } catch (error: unknown) {
        if (active) {
          setSessionState(stateFromRestorationError(error));
        }
      }
    })();

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [roomCode]);

  if (sessionState.status === "ready") {
    if (lobby.gameLoaded && !lobby.game) {
      return <LobbySessionNotice message="Esta partida não existe mais." />;
    }

    if (lobby.playerLoaded && !lobby.player) {
      return <LobbySessionNotice message="Você foi removido desta partida." />;
    }

    if (lobby.error) {
      return <LobbySessionNotice message="Não foi possível acompanhar o lobby." />;
    }

    const game = lobby.game ?? sessionState.session.game;
    const player = lobby.player ?? sessionState.session.player;

    if (game.status !== "lobby") {
      return (
        <PlayerRoleView
          gameId={sessionState.session.gameId}
          code={sessionState.session.code}
          experience={player.experience}
          game={game}
          alive={player.alive}
        />
      );
    }

    return (
      <RealtimeLobbyView
        code={sessionState.session.code}
        viewer="player"
        game={game}
        players={lobby.players}
        connectionStatus={connectionStatus}
        updating={lobby.isLoading}
      />
    );
  }

  const message =
    sessionState.status === "loading"
      ? "Restaurando sua sessão…"
      : sessionState.status === "removed"
        ? "Você foi removido desta partida."
        : sessionState.status === "missing"
          ? "Esta partida não existe mais."
          : sessionState.message;

  return (
    <LobbySessionNotice
      loading={sessionState.status === "loading"}
      message={message}
    />
  );
}
