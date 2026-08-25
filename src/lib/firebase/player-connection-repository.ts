"use client";

import {
  onDisconnect,
  onValue,
  ref,
  set,
  type Unsubscribe,
} from "firebase/database";

import { firebaseDatabase } from "./database";
import { firebasePaths } from "./paths";
import { toRealtimeDatabaseError } from "./realtime-database-error";
import { getDatabaseReference } from "./references";

export interface PlayerConnectionObserver {
  onConnectionChange: (connected: boolean) => void;
  onError: (error: Error) => void;
}

export interface FirebaseConnectionObserver {
  onConnectionChange: (connected: boolean) => void;
  onError: (error: Error) => void;
}

export function observeFirebaseConnection(
  observer: FirebaseConnectionObserver,
): Unsubscribe {
  const connectedReference = ref(firebaseDatabase, ".info/connected");

  try {
    return onValue(
      connectedReference,
      (snapshot) => observer.onConnectionChange(snapshot.val() === true),
      (error) =>
        observer.onError(
          toRealtimeDatabaseError(
            "observe-firebase-connection",
            ".info/connected",
            error,
          ),
        ),
    );
  } catch (error: unknown) {
    observer.onError(
      toRealtimeDatabaseError(
        "observe-firebase-connection",
        ".info/connected",
        error,
      ),
    );
    return () => undefined;
  }
}

export function trackPlayerConnection(
  gameId: string,
  uid: string,
  observer: PlayerConnectionObserver,
): Unsubscribe {
  const disconnectedPath = firebasePaths.gamePlayerField(
    gameId,
    uid,
    "disconnected",
  );
  const disconnectedReference = getDatabaseReference(disconnectedPath);

  return observeFirebaseConnection({
    onConnectionChange: (connected) => {
      observer.onConnectionChange(connected);

      if (!connected) {
        return;
      }

      const disconnectOperation = onDisconnect(disconnectedReference);

      void disconnectOperation
        .set(true)
        .then(() => set(disconnectedReference, false))
        .catch((error: unknown) =>
          observer.onError(
            toRealtimeDatabaseError(
              "track-player-connection",
              disconnectedPath,
              error,
            ),
          ),
        );
    },
    onError: observer.onError,
  });
}
