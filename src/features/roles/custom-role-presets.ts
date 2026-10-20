"use client";

import { onValue, push, remove, set, type Unsubscribe } from "firebase/database";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import { getDatabaseReference } from "@/lib/firebase/references";

/** Composição salva por um moderador; fica disponível em todas as salas. */
export interface CustomRolePreset {
  id: string;
  name: string;
  roleIds: string[];
  createdAt: number;
  createdByUid: string;
}

export function observeCustomRolePresets(
  onPresets: (presets: CustomRolePreset[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onValue(
    getDatabaseReference(firebasePaths.rolePresets),
    (snapshot) => {
      const value = (snapshot.val() ?? {}) as Record<string, Omit<CustomRolePreset, "id">>;
      onPresets(
        Object.entries(value)
          .map(([id, preset]) => ({ id, ...preset, roleIds: Object.values(preset.roleIds ?? {}) }))
          .sort((a, b) => b.createdAt - a.createdAt),
      );
    },
    onError,
  );
}

export async function saveCustomRolePreset(name: string, roleIds: readonly string[]): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("Moderador sem acesso autenticado.");
  await set(push(getDatabaseReference(firebasePaths.rolePresets)), {
    name: name.trim(),
    roleIds: [...roleIds],
    createdAt: Date.now(),
    createdByUid: uid,
  });
}

export async function deleteCustomRolePreset(presetId: string): Promise<void> {
  await remove(getDatabaseReference(firebasePaths.rolePreset(presetId)));
}
