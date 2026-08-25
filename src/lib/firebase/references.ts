"use client";

import { ref, type DatabaseReference } from "firebase/database";

import { firebaseDatabase } from "./database";
import { firebasePaths, type FirebasePath } from "./paths";
import { toRealtimeDatabaseError } from "./realtime-database-error";

export function getDatabaseRootReference(): DatabaseReference {
  try {
    return ref(firebaseDatabase);
  } catch (error: unknown) {
    throw toRealtimeDatabaseError("get-reference", "/", error);
  }
}

export function getDatabaseReference(path: FirebasePath): DatabaseReference {
  try {
    return ref(firebaseDatabase, path);
  } catch (error: unknown) {
    throw toRealtimeDatabaseError("get-reference", path, error);
  }
}

export function getGameReference(gameId: string): DatabaseReference {
  return getDatabaseReference(firebasePaths.game(gameId));
}

export function getRoomCodeReference(code: string): DatabaseReference {
  return getDatabaseReference(firebasePaths.roomCode(code));
}
