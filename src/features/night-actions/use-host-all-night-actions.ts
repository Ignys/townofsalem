"use client";

import { useEffect, useState } from "react";

import type { HostNightActionEntry } from "@/types";

interface HostAllNightActionsState {
  actions: Record<string, Record<string, HostNightActionEntry>>;
  error: Error | null;
  key: string;
  loaded: boolean;
}

export function useHostAllNightActions(
  gameId: string,
  hostUid: string,
  enabled: boolean,
) {
  const key = `${gameId}:${hostUid}:${enabled}`;
  const [state, setState] = useState<HostAllNightActionsState>({
    actions: {},
    error: null,
    key,
    loaded: !enabled,
  });

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let unsubscribe: () => void = () => undefined;

    void import("@/lib/firebase/realtime-database-repository")
      .then((repository) => {
        if (!active) return;
        unsubscribe = repository.observeHostAllNightActions(
          gameId,
          hostUid,
          {
            onData: (actions) => {
              if (!active) return;
              setState({
                actions: actions ?? {},
                error: null,
                key,
                loaded: true,
              });
            },
            onError: (error) => {
              if (!active) return;
              setState((current) => ({ ...current, error, key }));
            },
          },
        );
      })
      .catch((unknownError: unknown) => {
        if (!active) return;
        setState((current) => ({
          ...current,
          error:
            unknownError instanceof Error
              ? unknownError
              : new Error("Night action history unavailable"),
          key,
        }));
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, gameId, hostUid, key]);

  if (state.key !== key) {
    return { actions: {}, error: null, loaded: !enabled };
  }

  return {
    actions: state.actions,
    error: state.error,
    loaded: state.loaded,
  };
}
