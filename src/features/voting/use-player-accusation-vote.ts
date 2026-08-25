"use client";

import { useEffect, useState } from "react";

import { observeAuthenticatedAccusationVote } from "@/lib/firebase/realtime-database-repository";

export function usePlayerAccusationVote(gameId: string, dayNumber: number) {
  const [vote, setVote] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(
    () =>
      observeAuthenticatedAccusationVote(gameId, dayNumber, {
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
