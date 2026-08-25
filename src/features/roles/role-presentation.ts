import type { Faction, RoleDefinition } from "@/types";
import { NEEDS_VERIFICATION } from "@/types";

import { NEEDS_VERIFICATION_ALIGNMENT } from "@/data/roles/catalog-placeholders";

export const FACTION_LABELS: Record<Faction, string> = {
  town: "Cidade",
  mafia: "Máfia",
  neutral: "Neutros",
};

const COMBAT_LEVEL_LABELS = {
  basic: "Básico",
  powerful: "Poderoso",
  unstoppable: "Imparável",
  invincible: "Invencível",
} as const;

export interface ConfirmedCombatStat {
  label: "Ataque" | "Defesa";
  value: string;
}

export function formatRoleAlignment(alignment: string): string {
  return alignment === NEEDS_VERIFICATION_ALIGNMENT
    ? "Alinhamento a confirmar"
    : alignment;
}

export function getConfirmedCombatStats(
  role: RoleDefinition,
): readonly ConfirmedCombatStat[] {
  const stats: ConfirmedCombatStat[] = [];

  if (role.attack !== NEEDS_VERIFICATION && role.attack !== "none") {
    stats.push({ label: "Ataque", value: COMBAT_LEVEL_LABELS[role.attack] });
  }

  if (role.defense !== NEEDS_VERIFICATION && role.defense !== "none") {
    stats.push({ label: "Defesa", value: COMBAT_LEVEL_LABELS[role.defense] });
  }

  return stats;
}
