"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_GAME_VARIANTS,
  withDefaultVariants,
  type GameVariants,
} from "@/game-engine/variants";
import { DEFAULT_RANDOM_ROLE_EXCLUSIONS, parseRandomRoleExclusions } from "@/features/roles/random-role-slots";
import type { GameSettingsRecord } from "@/lib/firebase/schema";

import { saveGameVariants } from "./game-variants-repository";

export function useGameVariants(gameId: string | null) {
  const [variants, setVariants] = useState<GameVariants>({ ...DEFAULT_GAME_VARIANTS });
  const [amnesiacRolePool, setAmnesiacRolePool] = useState<readonly string[]>([]);
  const [randomRoleExclusions, setRandomRoleExclusions] = useState<readonly string[]>(DEFAULT_RANDOM_ROLE_EXCLUSIONS);
  const [roleCount, setRoleCount] = useState<number | null>(null);
  const [roleComposition, setRoleComposition] = useState<Record<string, number> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gameId) return;
    let active = true;
    let unsubscribe: () => void = () => undefined;
    void import("@/lib/firebase/realtime-database-repository").then((repository) => {
      if (!active) return;
      unsubscribe = repository.observeGameSettings(gameId, {
        onData: (settings: GameSettingsRecord | null) => {
          if (!active) return;
          setVariants(withDefaultVariants(settings?.gameVariants));
          setAmnesiacRolePool(settings?.amnesiacRolePool ?? []);
          setRandomRoleExclusions(parseRandomRoleExclusions(settings?.randomRoleExclusions));
          setRoleComposition(settings?.roleComposition ?? null);
          setRoleCount(settings?.roleComposition
            ? Object.values(settings.roleComposition).reduce(
                (total, count) => total + count,
                0,
              )
            : null);
          setLoaded(true);
          setError(null);
        },
        onError: (nextError) => {
          if (!active) return;
          setLoaded(true);
          setError(nextError);
        },
      });
    }).catch((reason: unknown) => {
      if (!active) return;
      setLoaded(true);
      setError(reason instanceof Error ? reason : new Error("variant-subscription-failed"));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [gameId]);

  const updateVariants = useCallback(async (
    next: GameVariants,
    nextAmnesiacRolePool: readonly string[] = amnesiacRolePool,
    nextRandomRoleExclusions: readonly string[] = randomRoleExclusions,
  ) => {
    if (!gameId || saving) return false;
    const previous = variants;
    const previousAmnesiacRolePool = amnesiacRolePool;
    const previousRandomRoleExclusions = randomRoleExclusions;
    setVariants(next);
    setAmnesiacRolePool(nextAmnesiacRolePool);
    setRandomRoleExclusions(nextRandomRoleExclusions);
    setSaving(true);
    setError(null);
    try {
      await saveGameVariants(gameId, next, nextAmnesiacRolePool, nextRandomRoleExclusions);
      setSaving(false);
      return true;
    } catch (reason: unknown) {
      setVariants(previous);
      setAmnesiacRolePool(previousAmnesiacRolePool);
      setRandomRoleExclusions(previousRandomRoleExclusions);
      setSaving(false);
      setError(reason instanceof Error ? reason : new Error("variant-save-failed"));
      return false;
    }
  }, [amnesiacRolePool, gameId, randomRoleExclusions, saving, variants]);

  return {
    variants,
    amnesiacRolePool,
    randomRoleExclusions,
    roleCount,
    roleComposition,
    loaded,
    saving,
    error,
    updateVariants,
  };
}
