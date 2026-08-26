import { FACTIONS, type Faction, type RoleDefinition } from "@/types";

import type { FactionCounts } from "./balanced-composition-generator";

function emptyFactionCounts(): Record<Faction, number> {
  return { town: 0, mafia: 0, neutral: 0 };
}

function countFactionCards(catalog: readonly RoleDefinition[]): FactionCounts {
  const counts = emptyFactionCounts();

  for (const role of catalog) counts[role.faction] += role.cardCount;

  return counts;
}

function countRequiredFactions(
  requiredRoleIds: readonly string[],
  catalog: readonly RoleDefinition[],
): FactionCounts | null {
  const rolesById = new Map(catalog.map((role) => [role.id, role]));
  const roleOccurrences = new Map<string, number>();
  const counts = emptyFactionCounts();

  for (const roleId of requiredRoleIds) {
    const role = rolesById.get(roleId);
    if (!role) return null;

    const occurrences = (roleOccurrences.get(roleId) ?? 0) + 1;
    if (occurrences > role.cardCount) return null;

    roleOccurrences.set(roleId, occurrences);
    counts[role.faction] += 1;
  }

  return counts;
}

function distanceFromPreferred(
  candidate: FactionCounts,
  preferred: FactionCounts,
) {
  return FACTIONS.reduce(
    (distance, faction) =>
      distance + Math.abs(candidate[faction] - preferred[faction]),
    0,
  );
}

/**
 * Finds the closest feasible faction split after reserving required cards.
 * This also keeps large games inside the physical capacity of each faction.
 */
export function getFeasibleFactionCounts(
  playerCount: number,
  preferred: FactionCounts,
  requiredRoleIds: readonly string[],
  catalog: readonly RoleDefinition[],
): FactionCounts | null {
  if (requiredRoleIds.length > playerCount) return null;

  const minimums = countRequiredFactions(requiredRoleIds, catalog);
  if (!minimums) return null;

  const capacities = countFactionCards(catalog);
  let best: FactionCounts | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let town = minimums.town; town <= capacities.town; town += 1) {
    for (let mafia = minimums.mafia; mafia <= capacities.mafia; mafia += 1) {
      const neutral = playerCount - town - mafia;
      if (neutral < minimums.neutral || neutral > capacities.neutral) continue;

      const candidate = { town, mafia, neutral };
      const distance = distanceFromPreferred(candidate, preferred);

      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }

  return best;
}
