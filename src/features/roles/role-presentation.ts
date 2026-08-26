import type { Faction, RoleDefinition } from "@/types";

import { NEEDS_VERIFICATION_ALIGNMENT } from "@/data/roles/catalog-placeholders";

export const FACTION_LABELS: Record<Faction, string> = {
  town: "Cidade",
  mafia: "Máfia",
  neutral: "Neutros",
};

export interface NightSurvivabilityStat {
  label: "Morte durante a noite";
  value: string;
}

export function formatRoleAlignment(alignment: string): string {
  return alignment === NEEDS_VERIFICATION_ALIGNMENT
    ? "Alinhamento a confirmar"
    : alignment;
}

export function getNightSurvivabilityStat(
  role: RoleDefinition,
): NightSurvivabilityStat {
  return {
    label: "Morte durante a noite",
    value: role.canDieAtNight ? "Pode morrer" : "Não pode morrer",
  };
}
