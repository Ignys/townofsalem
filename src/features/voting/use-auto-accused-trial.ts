"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GameVariants } from "@/game-engine/variants";
import type { PrivatePlayerRecord, PublicPlayerRecord } from "@/lib/firebase/schema";

import { selectAccusationTrigger, type AccusationTrigger } from "./accusation-threshold";
import { startAccusedTrial } from "./start-accused-trial";

/** Segundos de carência antes de levar o acusado ao julgamento. */
export const AUTO_TRIAL_COUNTDOWN_SECONDS = 3;

interface UseAutoAccusedTrialOptions {
  gameId: string;
  enabled: boolean;
  day: number;
  accusations?: Record<string, string>;
  players: Record<string, PublicPlayerRecord>;
  privatePlayers: Record<string, PrivatePlayerRecord>;
  variants: GameVariants;
}

/**
 * Observa o placar e leva automaticamente ao julgamento quando a maioria converge.
 *
 * Existe uma contagem regressiva curta com "Cancelar" porque só o mestre consegue
 * julgar, presencialmente, se a contagem foi um engano. Cancelar é puramente local:
 * nada é escrito no RTDB.
 */
export function useAutoAccusedTrial({
  gameId,
  enabled,
  day,
  accusations,
  players,
  privatePlayers,
  variants,
}: UseAutoAccusedTrialOptions) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissedKeys, setDismissedKeys] = useState<readonly string[]>([]);
  const triggeredRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const trigger: AccusationTrigger | null = enabled
    ? selectAccusationTrigger({ accusations, players, privatePlayers, variants })
    : null;
  const key = trigger ? `${day}:${trigger.targetUid}:${trigger.votes}` : null;
  const armed = key !== null && !dismissedKeys.includes(key);

  // Uma chave nova rearma a contagem; cancelar ou disparar a desarma.
  useEffect(() => {
    if (!armed || !key || triggeredRef.current === key) return;

    setCountdown(AUTO_TRIAL_COUNTDOWN_SECONDS);
    const interval = setInterval(
      () => setCountdown((current) => (current === null ? null : current - 1)),
      1000,
    );

    return () => {
      clearInterval(interval);
      setCountdown(null);
    };
  }, [armed, key]);

  useEffect(() => {
    if (countdown === null || countdown > 0) return;
    if (!trigger || !key || inFlightRef.current || triggeredRef.current === key) return;

    triggeredRef.current = key;
    inFlightRef.current = true;
    startAccusedTrial(gameId, trigger.targetUid)
      .catch(() => setError("O limiar mudou ou não foi possível iniciar o julgamento."))
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [countdown, gameId, key, trigger]);

  const cancel = useCallback(() => {
    if (key) setDismissedKeys((current) => [...current, key]);
  }, [key]);

  return {
    countdown: armed ? countdown : null,
    targetUid: trigger?.targetUid ?? null,
    targetName: trigger ? players[trigger.targetUid]?.name ?? null : null,
    error,
    cancel,
  };
}
