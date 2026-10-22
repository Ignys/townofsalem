"use client";

import { useEffect } from "react";

import { withDefaultVariants } from "@/game-engine/variants";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import { firebasePaths } from "@/lib/firebase/paths";
import type { AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";
import type { GamePace, GamePlayMode, GamePublicRecord, GameSettingsRecord } from "@/lib/firebase/schema";

const STORAGE_KEY = "tos:host-preferences";

/** Última configuração do mestre neste aparelho; vira o ponto de partida da próxima sala. */
interface HostPreferences {
  settings: Pick<GameSettingsRecord, "gameVariants" | "amnesiacRolePool" | "randomRoleExclusions" | "roleComposition">;
  playMode?: GamePlayMode;
  gamePace?: GamePace;
}

function loadHostPreferences(): HostPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HostPreferences) : null;
  } catch {
    return null;
  }
}

/** Atualizações do Firebase que levam as preferências salvas para uma sala recém-criada. */
export function hostPreferencesUpdate(gameId: string): AtomicUpdateMap | null {
  const preferences = loadHostPreferences();
  if (!preferences) return null;

  const { settings, playMode, gamePace } = preferences;
  const settingsRecord: GameSettingsRecord = {
      gameVariants: withDefaultVariants(settings.gameVariants),
      ...(settings.amnesiacRolePool?.length ? { amnesiacRolePool: settings.amnesiacRolePool } : {}),
      ...(settings.randomRoleExclusions !== undefined ? { randomRoleExclusions: settings.randomRoleExclusions } : {}),
      ...(settings.roleComposition && Object.keys(settings.roleComposition).length > 0 ? { roleComposition: settings.roleComposition } : {}),
  };
  return {
    // A regra exige todas as variantes; completa com os padrões o que faltar de versões antigas.
    [firebasePaths.gameSettings(gameId)]: settingsRecord,
    ...(playMode ? { [firebasePaths.gamePublicField(gameId, "playMode")]: playMode } : {}),
    ...(gamePace ? { [firebasePaths.gamePublicField(gameId, "gamePace")]: gamePace } : {}),
  };
}

/** Guarda neste aparelho cada mudança que o mestre faz no lobby. */
export function useRememberHostPreferences(gameId: string | null, game: GamePublicRecord | null) {
  const { variants, amnesiacRolePool, randomRoleExclusions, roleComposition, loaded } = useGameVariants(gameId);
  const playMode = game?.playMode;
  const gamePace = game?.gamePace;
  const inLobby = game?.status === "lobby" && game.phase === "lobby";

  useEffect(() => {
    if (!inLobby || !loaded) return;
    const preferences: HostPreferences = {
      settings: {
        gameVariants: variants,
        amnesiacRolePool,
        randomRoleExclusions: [...randomRoleExclusions].join(","),
        roleComposition: roleComposition ?? undefined,
      },
      playMode,
      gamePace,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Sem armazenamento (aba anônima, cota): a próxima sala só nasce com os padrões.
    }
  }, [amnesiacRolePool, gamePace, inLobby, loaded, playMode, randomRoleExclusions, roleComposition, variants]);
}
