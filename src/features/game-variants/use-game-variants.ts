"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_GAME_VARIANTS,
  withDefaultVariants,
  type GameVariants,
} from "@/game-engine/variants";
import type { GameSettingsRecord } from "@/lib/firebase/schema";

import { saveGameVariants } from "./game-variants-repository";

export function useGameVariants(gameId: string | null) {
  const [variants, setVariants] = useState<GameVariants>({ ...DEFAULT_GAME_VARIANTS });
  const [amnesiacRolePool, setAmnesiacRolePool] = useState<readonly string[]>([]);
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
  ) => {
    if (!gameId || saving) return false;
    const previous = variants;
    const previousAmnesiacRolePool = amnesiacRolePool;
    setVariants(next);
    setAmnesiacRolePool(nextAmnesiacRolePool);
    setSaving(true);
    setError(null);
    try {
      await saveGameVariants(gameId, next, nextAmnesiacRolePool);
      setSaving(false);
      return true;
    } catch (reason: unknown) {
      setVariants(previous);
      setAmnesiacRolePool(previousAmnesiacRolePool);
      setSaving(false);
      setError(reason instanceof Error ? reason : new Error("variant-save-failed"));
      return false;
    }
  }, [amnesiacRolePool, gameId, saving, variants]);

  return {
    variants,
    amnesiacRolePool,
    roleCount,
    roleComposition,
    loaded,
    saving,
    error,
    updateVariants,
  };
}
