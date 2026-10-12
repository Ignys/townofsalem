"use client";

import { useState } from "react";

import type { NightConsoleInteraction } from "@/features/lobby/night-console-interactions";
import { currentTimestamp } from "@/lib/utils/timestamp";
import type { PlayerNightActionSubmission } from "@/types";

import { savePlayerNightAction } from "./player-night-action-repository";

interface UsePlayerNightActionOptions {
  gameId: string;
  nightId: string;
  nightNumber: number;
  interaction: NightConsoleInteraction;
  submission?: PlayerNightActionSubmission;
  disabled: boolean;
}

/**
 * Escolha local até o jogador confirmar. Confirmar grava uma única vez: a regra do RTDB
 * não deixa trocar nem apagar, e o mestre também não edita uma ação confirmada pelo jogador.
 */
export function usePlayerNightAction({
  gameId,
  nightId,
  nightNumber,
  interaction,
  submission,
  disabled,
}: UsePlayerNightActionOptions) {
  const [draftTargetUids, setDraftTargetUids] = useState<readonly string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const targetCount = interaction.action.targetCount;
  const locked = Boolean(submission);
  const selectedTargetUids = submission?.targetUids ?? draftTargetUids;
  const chosenCount = draftTargetUids.filter(Boolean).length;

  const setTarget = (targetIndex: number, playerUid: string) => {
    if (disabled || locked || saving) return;
    setError(null);
    setDraftTargetUids(
      Array.from({ length: targetCount }, (_, index) =>
        index === targetIndex
          ? (draftTargetUids[index] === playerUid ? "" : playerUid)
          : draftTargetUids[index] ?? "",
      ),
    );
  };

  const confirm = () => {
    if (disabled || locked || saving) return;

    const timestamp = currentTimestamp();
    const payload: PlayerNightActionSubmission = {
      nightId,
      nightNumber,
      actionId: interaction.action.id,
      roleIdSnapshot: interaction.role.id,
      targetUids: draftTargetUids.filter(Boolean),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setSaving(true);
    setError(null);
    savePlayerNightAction(gameId, payload)
      .catch(() => {
        setError("Não foi possível enviar sua ação. Tente de novo; se continuar, a noite pode já ter acabado.");
      })
      .finally(() => setSaving(false));
  };

  return {
    selectedTargetUids,
    setTarget,
    locked,
    saving,
    error,
    /** Quantos alvos o jogador escolheu (antes de confirmar). */
    chosenCount,
    confirm,
    cancel: () => setDraftTargetUids([]),
  };
}
