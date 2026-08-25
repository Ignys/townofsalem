"use client";

import { onValue, ref, type Unsubscribe } from "firebase/database";

import { firebaseDatabase } from "./database";
import { toRealtimeDatabaseError } from "./realtime-database-error";

export interface ServerTimeOffsetObserver {
  onData: (offsetMs: number) => void;
  onError: (error: Error) => void;
}

export function observeServerTimeOffset(
  observer: ServerTimeOffsetObserver,
): Unsubscribe {
  const path = ".info/serverTimeOffset";
  const offsetReference = ref(firebaseDatabase, path);

  try {
    return onValue(
      offsetReference,
      (snapshot) => {
        const value = snapshot.val();
        observer.onData(typeof value === "number" ? value : 0);
      },
      (error) =>
        observer.onError(
          toRealtimeDatabaseError("observe-server-time-offset", path, error),
        ),
    );
  } catch (error: unknown) {
    observer.onError(
      toRealtimeDatabaseError("observe-server-time-offset", path, error),
    );
    return () => undefined;
  }
}
