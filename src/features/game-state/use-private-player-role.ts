"use client";

import { useEffect, useState } from "react";

import type { PrivatePlayerRecord } from "@/lib/firebase/schema";

interface PrivatePlayerRoleState {
  gameId: string | null;
  privatePlayer: PrivatePlayerRecord | null;
  loaded: boolean;
  error: Error | null;
}

export interface PrivatePlayerRoleResult {
  privatePlayer: PrivatePlayerRecord | null;
  loaded: boolean;
  error: Error | null;
}

const initialState: PrivatePlayerRoleState = {
  gameId: null,
  privatePlayer: null,
  loaded: false,
  error: null,
};

export function usePrivatePlayerRole(
  gameId: string | null,
): PrivatePlayerRoleResult {
  const [state, setState] = useState<PrivatePlayerRoleState>(initialState);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    let active = true;
    let unsubscribe: () => void = () => undefined;

    void import("@/lib/firebase/realtime-database-repository")
      .then((repository) => {
        if (!active) {
          return;
        }

        unsubscribe = repository.observeAuthenticatedPrivatePlayer(gameId, {
          onData: (privatePlayer) => {
            if (active) {
              setState({
                gameId,
                privatePlayer,
                loaded: true,
                error: null,
              });
            }
          },
          onError: (error) => {
            if (active) {
              setState({
                gameId,
                privatePlayer: null,
                loaded: true,
                error,
              });
            }
          },
        });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            gameId,
            privatePlayer: null,
            loaded: true,
            error:
              error instanceof Error
                ? error
                : new Error("Unknown private role subscription error."),
          });
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [gameId]);

  if (!gameId || state.gameId !== gameId) {
    return { privatePlayer: null, loaded: false, error: null };
  }

  return {
    privatePlayer: state.privatePlayer,
    loaded: state.loaded,
    error: state.error,
  };
}
