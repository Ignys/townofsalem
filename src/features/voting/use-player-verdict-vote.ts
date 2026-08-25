"use client";

import { useEffect, useState } from "react";

import { observeAuthenticatedVerdictVote } from "@/lib/firebase/realtime-database-repository";
import type { VerdictVote } from "@/lib/firebase/schema";

export function usePlayerVerdictVote(gameId: string, dayNumber: number) {
  const [vote, setVote] = useState<VerdictVote | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(
    () =>
      observeAuthenticatedVerdictVote(gameId, dayNumber, {
        onData: (value) => {
          setVote(value);
          setLoaded(true);
          setError(false);
        },
        onError: () => {
          setLoaded(true);
          setError(true);
        },
      }),
    [dayNumber, gameId],
  );

  return { vote, loaded, error };
}
