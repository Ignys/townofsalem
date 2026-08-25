"use client";

import { useEffect, useState } from "react";

import type { PrivatePlayerRecord } from "@/lib/firebase/schema";

interface HostRoleAssignmentsState {
  subscriptionKey: string | null;
  assignments: Record<string, PrivatePlayerRecord>;
  loaded: boolean;
  error: Error | null;
}

export interface HostRoleAssignmentsResult {
  assignments: Record<string, PrivatePlayerRecord>;
  loaded: boolean;
  error: Error | null;
}

const initialState: HostRoleAssignmentsState = {
  subscriptionKey: null,
  assignments: {},
  loaded: false,
  error: null,
};

export function useHostRoleAssignments(
  gameId: string,
  verifiedHostUid: string,
): HostRoleAssignmentsResult {
  const subscriptionKey = `${gameId}:${verifiedHostUid}`;
  const [state, setState] = useState<HostRoleAssignmentsState>(initialState);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => undefined;

    void import("@/lib/firebase/realtime-database-repository")
      .then((repository) => {
        if (!active) {
          return;
        }

        unsubscribe = repository.observeHostPrivatePlayers(
          gameId,
          verifiedHostUid,
          {
            onData: (assignments) => {
              if (active) {
                setState({
                  subscriptionKey,
                  assignments: assignments ?? {},
                  loaded: true,
                  error: null,
                });
              }
            },
            onError: (error) => {
              if (active) {
                setState({
                  subscriptionKey,
                  assignments: {},
                  loaded: true,
                  error,
                });
              }
            },
          },
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            subscriptionKey,
            assignments: {},
            loaded: true,
            error:
              error instanceof Error
                ? error
                : new Error("Unknown host role subscription error."),
          });
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [gameId, subscriptionKey, verifiedHostUid]);

  if (state.subscriptionKey !== subscriptionKey) {
    return { assignments: {}, loaded: false, error: null };
  }

  return {
    assignments: state.assignments,
    loaded: state.loaded,
    error: state.error,
  };
}
