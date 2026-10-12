"use client";

import { useState } from "react";

import type { NightConsoleInteraction } from "@/features/lobby/night-console-interactions";
import { currentTimestamp } from "@/lib/utils/timestamp";
import type { PlayerNightActionSubmission } from "@/types";

import { savePlayerNightAction, shareMafiaDraftPick } from "./player-night-action-repository";

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
  shareWithMafia = false,
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
    const next = Array.from({ length: targetCount }, (_, index) =>
      index === targetIndex
        ? (draftTargetUids[index] === playerUid ? "" : playerUid)
        : draftTargetUids[index] ?? "",
    );
    setDraftTargetUids(next);
    shareDraft(next);
  };

  const shareDraft = (targetUids: readonly string[]) => {
    if (!shareWithMafia) return;
    void shareMafiaDraftPick(gameId, nightId, interaction.action.id, targetUids).catch(() => undefined);
  };

  const submit = (skipped: boolean) => {
    if (disabled || locked || saving) return;

    const timestamp = currentTimestamp();
    const payload: PlayerNightActionSubmission = {
      nightId,
      nightNumber,
      actionId: interaction.action.id,
      roleIdSnapshot: interaction.role.id,
      targetUids: skipped ? [] : draftTargetUids.filter(Boolean),
      ...(skipped ? { skipped: true } : {}),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setSaving(true);
    setError(null);
    savePlayerNightAction(gameId, payload, shareWithMafia)
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
    /** Pular: trava "nenhuma ação" para esta noite. */
    skipped: Boolean(submission?.skipped),
    confirm: () => submit(false),
    skip: () => submit(true),
    cancel: () => {
      setDraftTargetUids([]);
      shareDraft([]);
    },
  };
}
