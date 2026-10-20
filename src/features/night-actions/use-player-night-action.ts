"use client";

import { useState } from "react";

import type { NightConsoleInteraction } from "@/features/lobby/night-console-interactions";
import { currentTimestamp } from "@/lib/utils/timestamp";
import type { PlayerNightActionSubmission } from "@/types";

import { savePlayerNightChoice } from "./player-night-action-repository";

interface UsePlayerNightActionOptions {
  gameId: string;
  nightId: string;
  nightNumber: number;
  interaction: NightConsoleInteraction;
  submission?: PlayerNightActionSubmission;
  disabled: boolean;
  /** Membro da Máfia: a escolha aparece ao vivo para o resto da Máfia. */
  shareWithMafia?: boolean;
}

/**
 * Como no jogo digital: cada toque já salva a escolha, e o jogador pode trocar até a noite
 * acabar. O que estiver salvo nesse momento é a ação dele; nada salvo, nada acontece.
 */
export function usePlayerNightAction({
  gameId,
  nightId,
  nightNumber,
  interaction,
  submission,
  disabled,
  shareWithMafia = false,
}: UsePlayerNightActionOptions) {
  // A escolha local só cobre o intervalo até o servidor confirmar a gravação.
  const [draftTargetUids, setDraftTargetUids] = useState<readonly string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const targetCount = interaction.action.targetCount;
  const savedTargetUids = submission?.targetUids ?? [];
  const selectedTargetUids = draftTargetUids ?? savedTargetUids;
  const chosenCount = selectedTargetUids.filter(Boolean).length;

  const save = (targetUids: readonly string[], active: boolean) => {
    if (disabled) return;
    const timestamp = currentTimestamp();
    const payload: PlayerNightActionSubmission | null = active
      ? {
          nightId,
          nightNumber,
          actionId: interaction.action.id,
          roleIdSnapshot: interaction.role.id,
          targetUids: targetUids.filter(Boolean),
          createdAt: submission?.createdAt ?? timestamp,
          updatedAt: timestamp,
        }
      : null;

    setDraftTargetUids(targetUids);
    setError(null);
    savePlayerNightChoice(gameId, nightId, interaction.action.id, payload, shareWithMafia)
      .catch(() => {
        setError("Não foi possível salvar sua escolha. Tente de novo; se continuar, a noite pode já ter acabado.");
      })
      .finally(() => setDraftTargetUids(null));
  };

  const setTarget = (targetIndex: number, playerUid: string) => {
    const next = Array.from({ length: targetCount }, (_, index) =>
      index === targetIndex
        ? (selectedTargetUids[index] === playerUid ? "" : playerUid)
        : selectedTargetUids[index] ?? "",
    );
    save(next, next.some(Boolean));
  };

  return {
    selectedTargetUids,
    setTarget,
    error,
    /** Quantos alvos estão escolhidos agora. */
    chosenCount,
    /** Ação sem alvo (ex.: alerta do Veteran): ligada ou não nesta noite. */
    active: Boolean(submission),
    toggle: () => save([], !submission),
  };
}
