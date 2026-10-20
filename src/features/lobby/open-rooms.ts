"use client";

import {
  onValue,
  orderByChild,
  query,
  startAt,
  type Unsubscribe,
} from "firebase/database";

import { firebasePaths } from "@/lib/firebase/paths";
import { getDatabaseReference } from "@/lib/firebase/references";

export interface OpenRoom {
  code: string;
  name: string;
  createdAt: number;
  playerCount?: number;
  status?: "lobby" | "in-progress" | "finished";
}

// ponytail: salas antigas nunca são apagadas, só escondidas após 12h; limpar no fim da partida se o nó crescer.
const OPEN_ROOM_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function observeOpenRooms(
  onRooms: (rooms: OpenRoom[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const recentRooms = query(
    getDatabaseReference(firebasePaths.openRooms),
    orderByChild("createdAt"),
    startAt(Date.now() - OPEN_ROOM_MAX_AGE_MS),
  );

  return onValue(
    recentRooms,
    (snapshot) => {
      const value = (snapshot.val() ?? {}) as Record<
        string,
        Omit<OpenRoom, "code">
      >;
      onRooms(
        Object.entries(value)
          .map(([code, room]) => ({ code, ...room }))
          .sort((a, b) => b.createdAt - a.createdAt),
      );
    },
    onError,
  );
}
