"use client";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import type { NightTeam, PlayerNightActionSubmission } from "@/types";

function requireAuthenticatedPlayerUid(): string {
  const uid = firebaseAuth.currentUser?.uid;

  if (!uid) {
    throw new Error("An authenticated player is required to submit a night action.");
  }

  return uid;
}

/**
 * Grava a escolha atual do jogador (ou apaga, com `null`). Ele pode trocar até a noite
 * acabar; o que estiver salvo nesse momento é a ação dele.
 *
 * A regra do RTDB é a autoridade (fase, noite corrente, vivo, noite ainda não resolvida)
 * e o espelhamento no host é idempotente pelo id determinístico.
 */
export function savePlayerNightChoice(
  gameId: string,
  nightId: string,
  actionId: string,
  submission: PlayerNightActionSubmission | null,
  shareWithTeam?: NightTeam,
): Promise<void> {
  const uid = requireAuthenticatedPlayerUid();

  return applyAtomicUpdate({
    [firebasePaths.gamePlayerNightAction(gameId, nightId, uid, actionId)]: submission,
    // A Máfia (ou os Vampiros) acompanha a escolha ao vivo.
    ...(shareWithTeam
      ? {
          [firebasePaths.gameMafiaBoardPick(gameId, nightId, uid, actionId, shareWithTeam)]: {
            targetUids: [...(submission?.targetUids ?? [])],
            locked: false,
            updatedAt: Date.now(),
          },
        }
      : {}),
  });
}
