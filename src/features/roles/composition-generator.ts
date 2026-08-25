import type { Faction, RoleDefinition } from "@/types";

export interface CompositionSlot {
  id: string;
  label: string;
  count: number;
  roleIds?: readonly string[];
  factions?: readonly Faction[];
  alignments?: readonly string[];
  allowDuplicates?: boolean;
}

export type CompositionGenerationResult =
  | { ok: true; roleIds: readonly string[] }
  | { ok: false; code: "PLAYER_COUNT_MISMATCH" | "NO_ELIGIBLE_ROLE" | "INVALID_RNG"; slotId?: string };

export function generateRoleComposition(
  playerCount: number,
  slots: readonly CompositionSlot[],
  catalog: readonly RoleDefinition[],
  random: () => number,
): CompositionGenerationResult {
  const requested = slots.reduce((total, slot) => total + slot.count, 0);
  if (!Number.isInteger(playerCount) || requested !== playerCount) return { ok: false, code: "PLAYER_COUNT_MISMATCH" };
  const selected: string[] = [];

  for (const slot of slots) {
    for (let index = 0; index < slot.count; index += 1) {
      const eligible = catalog.filter((role) =>
        (!slot.roleIds || slot.roleIds.includes(role.id)) &&
        (!slot.factions || slot.factions.includes(role.faction)) &&
        (!slot.alignments || slot.alignments.includes(role.alignment)) &&
        (slot.allowDuplicates || !selected.includes(role.id))
      ).sort((a, b) => a.id.localeCompare(b.id));
      if (eligible.length === 0) return { ok: false, code: "NO_ELIGIBLE_ROLE", slotId: slot.id };
      const value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) return { ok: false, code: "INVALID_RNG", slotId: slot.id };
      selected.push(eligible[Math.floor(value * eligible.length)].id);
    }
  }
  return { ok: true, roleIds: selected };
}
