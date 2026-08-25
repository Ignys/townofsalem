"use client";

import { useEffect, useState } from "react";

export type FirebaseConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "unavailable";

interface ConnectionState {
  enabled: boolean;
  status: FirebaseConnectionStatus;
}

export function useFirebaseConnection(
  enabled: boolean,
): FirebaseConnectionStatus {
  const [state, setState] = useState<ConnectionState>({
    enabled: false,
    status: "connecting",
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    let unsubscribe: () => void = () => undefined;

    void import("@/lib/firebase/player-connection-repository")
      .then((repository) => {
        if (!active) {
          return;
        }

        unsubscribe = repository.observeFirebaseConnection({
          onConnectionChange: (connected) => {
            if (active) {
              setState({
                enabled: true,
                status: connected ? "connected" : "reconnecting",
              });
            }
          },
          onError: () => {
            if (active) {
              setState({ enabled: true, status: "unavailable" });
            }
          },
        });
      })
      .catch(() => {
        if (active) {
          setState({ enabled: true, status: "unavailable" });
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled]);

  return state.enabled === enabled ? state.status : "connecting";
}
