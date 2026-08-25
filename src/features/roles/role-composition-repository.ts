"use client";

import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import { roleIdsToCompositionRecord } from "./role-composition";

export async function saveRoleComposition(
  gameId: string,
  roleIds: readonly string[],
): Promise<void> {
  const composition = roleIdsToCompositionRecord(roleIds);

  await applyAtomicUpdate({
    [firebasePaths.gameSettingsField(gameId, "roleComposition")]:
      Object.keys(composition).length > 0 ? composition : null,
  });
}
