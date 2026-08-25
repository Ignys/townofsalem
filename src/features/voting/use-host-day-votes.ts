"use client";

import { useEffect, useState } from "react";

import { observeHostDayVotes } from "@/lib/firebase/realtime-database-repository";
import type { DayVotesRecord } from "@/lib/firebase/schema";

export function useHostDayVotes(
  gameId: string,
  dayNumber: number,
  verifiedHostUid: string,
) {
  const [votes, setVotes] = useState<DayVotesRecord>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(
    () =>
      observeHostDayVotes(gameId, dayNumber, verifiedHostUid, {
        onData: (value) => {
          setVotes(value ?? {});
          setLoaded(true);
          setError(false);
        },
        onError: () => {
          setLoaded(true);
          setError(true);
        },
      }),
    [dayNumber, gameId, verifiedHostUid],
  );

  return { votes, loaded, error };
}
