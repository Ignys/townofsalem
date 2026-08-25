"use client";

import { useEffect, useState } from "react";

import type {
  GamePublicRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";

interface RealtimeLobbyOptions {
  gameId: string | null;
  playerUid?: string;
}

interface RealtimeLobbyState {
  subscriptionKey: string | null;
  game: GamePublicRecord | null;
  players: Record<string, PublicPlayerRecord>;
  player: PublicPlayerRecord | null;
  gameLoaded: boolean;
  playersLoaded: boolean;
  playerLoaded: boolean;
  error: Error | null;
}

export interface RealtimeLobbyResult {
  game: GamePublicRecord | null;
  players: Record<string, PublicPlayerRecord>;
  player: PublicPlayerRecord | null;
  gameLoaded: boolean;
  playerLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

const initialState: RealtimeLobbyState = {
  subscriptionKey: null,
  game: null,
  players: {},
  player: null,
  gameLoaded: false,
  playersLoaded: false,
  playerLoaded: false,
  error: null,
};

export function useRealtimeLobby({
  gameId,
  playerUid,
}: RealtimeLobbyOptions): RealtimeLobbyResult {
  const subscriptionKey = gameId
    ? `${gameId}:${playerUid ?? "host"}`
    : null;
  const [state, setState] = useState<RealtimeLobbyState>(initialState);

  useEffect(() => {
    if (!gameId || !subscriptionKey) {
      return;
    }

    let active = true;
    const unsubscribers: Array<() => void> = [];
    let game: GamePublicRecord | null = null;
    let players: Record<string, PublicPlayerRecord> = {};
    let player: PublicPlayerRecord | null = null;
    let gameLoaded = false;
    let playersLoaded = false;
    let playerLoaded = !playerUid;
    let subscriptionError: Error | null = null;

    const publish = (error?: Error) => {
      if (!active) {
        return;
      }

      if (error) {
        subscriptionError = error;
      }

      setState({
        subscriptionKey,
        game,
        players,
        player,
        gameLoaded,
        playersLoaded,
        playerLoaded,
        error: subscriptionError,
      });
    };

    void import("@/lib/firebase/realtime-database-repository")
      .then((repository) => {
        if (!active) {
          return;
        }

        const onError = (error: Error) => publish(error);

        unsubscribers.push(
          repository.observePublicGame(gameId, {
            onData: (value) => {
              game = value;
              gameLoaded = true;
              publish();
            },
            onError,
          }),
          repository.observeGamePlayers(gameId, {
            onData: (value) => {
              players = value ?? {};
              playersLoaded = true;
              publish();
            },
            onError,
          }),
        );

        if (playerUid) {
          unsubscribers.push(
            repository.observePublicPlayer(gameId, playerUid, {
              onData: (value) => {
                player = value;
                playerLoaded = true;
                publish();
              },
              onError,
            }),
          );
        }
      })
      .catch((error: unknown) =>
        publish(
          error instanceof Error
            ? error
            : new Error("Unknown lobby subscription error."),
        ),
      );

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [gameId, playerUid, subscriptionKey]);

  if (!subscriptionKey || state.subscriptionKey !== subscriptionKey) {
    return {
      game: null,
      players: {},
      player: null,
      gameLoaded: false,
      playerLoaded: false,
      isLoading: Boolean(subscriptionKey),
      error: null,
    };
  }

  return {
    game: state.game,
    players: state.players,
    player: state.player,
    gameLoaded: state.gameLoaded,
    playerLoaded: state.playerLoaded,
    isLoading:
      !state.gameLoaded || !state.playersLoaded || !state.playerLoaded,
    error: state.error,
  };
}
