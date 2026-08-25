"use client";

import { deriveTimerState, type TimerSnapshot } from "./timer-state";
import { useServerAdjustedNow } from "./use-server-adjusted-now";

export function useSynchronizedTimer(snapshot: TimerSnapshot) {
  const serverTime = useServerAdjustedNow();

  return {
    ...deriveTimerState(snapshot, serverTime.now),
    serverAdjustedNow: serverTime.now,
    serverTimeOffsetMs: serverTime.offsetMs,
    serverOffsetAvailable: serverTime.offsetAvailable,
  };
}
