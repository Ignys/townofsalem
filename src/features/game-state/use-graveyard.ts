"use client";

import { useEffect, useState } from "react";

import type { GraveyardEntryRecord } from "@/lib/firebase/schema";

/** Public tombstones for the current game, keyed by player uid. */
export function useGraveyard(gameId: string | null) {
  const [graveyard, setGraveyard] = useState<Record<string, GraveyardEntryRecord>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    let active = true;
    let unsubscribe: () => void = () => undefined;

    void import("@/lib/firebase/realtime-database-repository")
      .then((repository) => {
        if (!active) return;
        unsubscribe = repository.observeGameGraveyard(gameId, {
          onData: (value) => {
            if (!active) return;
            setGraveyard(value ?? {});
            setLoaded(true);
          },
          // A missing graveyard is not worth blocking the screen for: the board
          // simply shows the dead without roles.
          onError: () => {
            if (!active) return;
            setLoaded(true);
          },
        });
      })
      .catch(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [gameId]);

  return { graveyard, loaded };
}
