"use client";

import type { GameVariants } from "@/game-engine/variants";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

export async function saveGameVariants(
  gameId: string,
  variants: GameVariants,
  amnesiacRolePool: readonly string[],
): Promise<void> {
  await applyAtomicUpdate({
    [firebasePaths.gameSettingsField(gameId, "gameVariants")]: variants,
    [firebasePaths.gameSettingsField(gameId, "amnesiacRolePool")]: [...amnesiacRolePool],
  });
}
