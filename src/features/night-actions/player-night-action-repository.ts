"use client";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import type { PlayerNightActionSubmission } from "@/types";

function requireAuthenticatedPlayerUid(): string {
  const uid = firebaseAuth.currentUser?.uid;

  if (!uid) {
    throw new Error("An authenticated player is required to submit a night action.");
  }

  return uid;
}

/**
 * Grava a submissão confirmada do jogador.
 *
 * A regra do RTDB é a autoridade (fase, noite corrente, vivo, noite ainda não resolvida,
 * escrita única) e o espelhamento no host é idempotente pelo id determinístico.
 */
export function savePlayerNightAction(
  gameId: string,
  submission: PlayerNightActionSubmission,
): Promise<void> {
  const uid = requireAuthenticatedPlayerUid();

  return applyAtomicUpdate({
    [firebasePaths.gamePlayerNightAction(
      gameId,
      submission.nightId,
      uid,
      submission.actionId,
    )]: submission,
  });
}
