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
  shareWithMafia = false,
): Promise<void> {
  const uid = requireAuthenticatedPlayerUid();

  return applyAtomicUpdate({
    [firebasePaths.gamePlayerNightAction(
      gameId,
      submission.nightId,
      uid,
      submission.actionId,
    )]: submission,
    // A Máfia vê a escolha travar junto com a confirmação.
    ...(shareWithMafia
      ? {
          [firebasePaths.gameMafiaBoardPick(gameId, submission.nightId, uid, submission.actionId)]: {
            targetUids: [...submission.targetUids],
            locked: true,
            updatedAt: submission.updatedAt,
          },
        }
      : {}),
  });
}

/** Escolha ainda não confirmada, para a Máfia acompanhar ao vivo. */
export function shareMafiaDraftPick(
  gameId: string,
  nightId: string,
  actionId: string,
  targetUids: readonly string[],
): Promise<void> {
  const uid = requireAuthenticatedPlayerUid();

  return applyAtomicUpdate({
    [firebasePaths.gameMafiaBoardPick(gameId, nightId, uid, actionId)]: {
      targetUids: targetUids.filter(Boolean),
      locked: false,
      updatedAt: Date.now(),
    },
  });
}
