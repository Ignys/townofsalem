"use client";

import { useEffect, useRef, useState } from "react";

import type { NightConsoleInteraction } from "@/features/lobby/night-console-interactions";
import { currentTimestamp } from "@/lib/utils/timestamp";
import type { PlayerNightActionSubmission } from "@/types";

import {
  clearPlayerNightAction,
  savePlayerNightAction,
} from "./player-night-action-repository";

interface UsePlayerNightActionOptions {
  gameId: string;
  nightId: string;
  nightNumber: number;
  interaction: NightConsoleInteraction;
  submission?: PlayerNightActionSubmission;
  disabled: boolean;
}

export function usePlayerNightAction({
  gameId,
  nightId,
  nightNumber,
  interaction,
  submission,
  disabled,
}: UsePlayerNightActionOptions) {
  const [selectedTargetUids, setSelectedTargetUids] = useState<readonly string[]>(
    submission?.targetUids ?? [],
  );
  const [recorded, setRecorded] = useState(Boolean(submission));
  const [error, setError] = useState<string | null>(null);
  const createdAtRef = useRef(submission?.createdAt);
  const saveQueueRef = useRef(Promise.resolve());
  const dirtyRef = useRef(false);

  // Reidrata a partir do servidor enquanto o jogador não mexeu (ex.: reconexão).
  useEffect(() => {
    if (dirtyRef.current) return;
    setSelectedTargetUids(submission?.targetUids ?? []);
    setRecorded(Boolean(submission));
    createdAtRef.current = submission?.createdAt;
  }, [submission]);

  const persist = (targetUids: readonly string[]) => {
    if (disabled) return;

    const timestamp = currentTimestamp();
    const createdAt = createdAtRef.current ?? timestamp;
    createdAtRef.current = createdAt;
    dirtyRef.current = true;

    const payload: PlayerNightActionSubmission = {
      nightId,
      nightNumber,
      actionId: interaction.action.id,
      roleIdSnapshot: interaction.role.id,
      targetUids,
      createdAt,
      updatedAt: timestamp,
    };

    setRecorded(true);
    setError(null);
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => savePlayerNightAction(gameId, payload))
      .catch(() => {
        setError("Não foi possível enviar sua ação. A noite pode já ter sido resolvida pelo mestre.");
        setRecorded(false);
      });
  };

  const setTarget = (targetIndex: number, playerUid: string) => {
    const nextTargets = Array.from(
      { length: Math.max(interaction.action.targetCount, 1) },
      (_, index) => (index === targetIndex ? playerUid : selectedTargetUids[index] ?? ""),
    ).filter((uid, index) => uid !== "" || index < interaction.action.targetCount);

    setSelectedTargetUids(nextTargets);
    if (nextTargets.filter(Boolean).length === interaction.action.targetCount) {
      persist(nextTargets);
    }
  };

  const clear = () => {
    if (disabled) return;
    dirtyRef.current = true;
    setSelectedTargetUids([]);
    setRecorded(false);
    setError(null);
    createdAtRef.current = undefined;
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => clearPlayerNightAction(gameId, nightId, interaction.action.id))
      .catch(() => setError("Não foi possível remover sua ação."));
  };

  return {
    selectedTargetUids,
    setTarget,
    recorded,
    error,
    recordNoTargetAction: () => persist([]),
    clear,
  };
}
