"use client";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import type { VerdictVote } from "@/lib/firebase/schema";

function requireAuthenticatedPlayerUid(): string {
  const uid = firebaseAuth.currentUser?.uid;

  if (!uid) {
    throw new Error("An authenticated player is required to vote.");
  }

  return uid;
}

export function saveAccusationVote(
  gameId: string,
  dayNumber: number,
  targetUid: string | null,
): Promise<void> {
  const uid = requireAuthenticatedPlayerUid();

  return applyAtomicUpdate({
    [firebasePaths.gameAccusation(gameId, dayNumber, uid)]: targetUid,
  });
}

export function saveVerdictVote(
  gameId: string,
  dayNumber: number,
  verdict: VerdictVote,
): Promise<void> {
  const uid = requireAuthenticatedPlayerUid();

  return applyAtomicUpdate({
    [firebasePaths.gameVerdict(gameId, dayNumber, uid)]: verdict,
  });
}
