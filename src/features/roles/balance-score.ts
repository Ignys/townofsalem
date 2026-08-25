import type { Faction, RoleDefinition } from "@/types";

export const BALANCE_RANGES = {
  perfect: 0,
  close: 3,
  moderate: 7,
} as const;

export type BalanceRating =
  | "perfect"
  | "close"
  | "moderate"
  | "unbalanced";

export interface BalanceScoreResult {
  total: number;
  distanceFromZero: number;
  factionScores: Readonly<Record<Faction, number>>;
  rating: BalanceRating;
  favoredSide: "town" | "evil" | "none";
  factors: readonly string[];
  warnings: readonly string[];
}

export const BALANCE_RATING_LABELS: Record<BalanceRating, string> = {
  perfect: "Perfeitamente balanceada",
  close: "Próxima do equilíbrio",
  moderate: "Vantagem perceptível",
  unbalanced: "Fortemente desequilibrada",
};

function rateBalance(distanceFromZero: number): BalanceRating {
  if (distanceFromZero === BALANCE_RANGES.perfect) return "perfect";
  if (distanceFromZero <= BALANCE_RANGES.close) return "close";
  if (distanceFromZero <= BALANCE_RANGES.moderate) return "moderate";
  return "unbalanced";
}

export function calculateRoleBalance(
  roleIds: readonly string[],
  catalog: readonly RoleDefinition[],
): BalanceScoreResult {
  const roles = new Map(catalog.map((role) => [role.id, role]));
  const factionScores: Record<Faction, number> = {
    town: 0,
    mafia: 0,
    neutral: 0,
  };
  const factors: string[] = [];
  const warnings: string[] = [];
  let total = 0;

  for (const roleId of roleIds) {
    const role = roles.get(roleId);

    if (!role) {
      warnings.push(`Role desconhecida ignorada no balanceamento: ${roleId}.`);
      continue;
    }

    total += role.virtueValue;
    factionScores[role.faction] += role.virtueValue;
    factors.push(
      `${role.name}: ${role.virtueValue > 0 ? "+" : ""}${role.virtueValue}`,
    );
  }

  const distanceFromZero = Math.abs(total);

  return {
    total,
    distanceFromZero,
    factionScores,
    rating: rateBalance(distanceFromZero),
    favoredSide: total > 0 ? "town" : total < 0 ? "evil" : "none",
    factors,
    warnings,
  };
}
