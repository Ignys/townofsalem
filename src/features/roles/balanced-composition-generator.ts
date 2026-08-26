import type { Faction, RoleDefinition } from "@/types";

import { calculateRoleBalance } from "./balance-score";

export type FactionCounts = Readonly<Record<Faction, number>>;

export type BalancedCompositionResult =
  | {
      ok: true;
      roleIds: readonly string[];
      virtueTotal: number;
    }
  | {
      ok: false;
      code: "PLAYER_COUNT_MISMATCH" | "INSUFFICIENT_CARDS";
      faction?: Faction;
    };

interface Candidate {
  roleIds: readonly string[];
  score: number;
}

function buildFactionCandidates(
  roles: readonly RoleDefinition[],
  count: number,
  requiredRoleIds: readonly string[],
): readonly Candidate[] {
  const requiredCounts = requiredRoleIds.reduce<Record<string, number>>(
    (counts, roleId) => {
      counts[roleId] = (counts[roleId] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const requiredScore = requiredRoleIds.reduce((score, roleId) => {
    const role = roles.find((candidate) => candidate.id === roleId);
    return score + (role?.virtueValue ?? 0);
  }, 0);
  let states = new Map<string, Candidate>([
    [
      `${requiredRoleIds.length}:${requiredScore}`,
      { roleIds: requiredRoleIds, score: requiredScore },
    ],
  ]);

  for (const role of roles) {
    const next = new Map(states);
    const availableCopies = role.cardCount - (requiredCounts[role.id] ?? 0);

    for (const candidate of states.values()) {
      for (
        let copies = 1;
        copies <= availableCopies && candidate.roleIds.length + copies <= count;
        copies += 1
      ) {
        const roleIds = [
          ...candidate.roleIds,
          ...Array<string>(copies).fill(role.id),
        ];
        const score = candidate.score + copies * role.virtueValue;
        const key = `${roleIds.length}:${score}`;

        if (!next.has(key)) next.set(key, { roleIds, score });
      }
    }

    states = next;
  }

  return [...states.values()].filter(
    (candidate) => candidate.roleIds.length === count,
  );
}

function compareRoleLists(left: readonly string[], right: readonly string[]) {
  return left.join("|").localeCompare(right.join("|"));
}

export function generateBalancedRoleComposition(
  playerCount: number,
  factionCounts: FactionCounts,
  catalog: readonly RoleDefinition[],
  requiredRoleIds: readonly string[] = [],
): BalancedCompositionResult {
  const requested = Object.values(factionCounts).reduce(
    (total, count) => total + count,
    0,
  );

  if (!Number.isInteger(playerCount) || requested !== playerCount) {
    return { ok: false, code: "PLAYER_COUNT_MISMATCH" };
  }

  const catalogById = new Map(catalog.map((role) => [role.id, role]));
  const requiredCounts = new Map<string, number>();

  if (requiredRoleIds.length > playerCount) {
    return { ok: false, code: "PLAYER_COUNT_MISMATCH" };
  }

  for (const roleId of requiredRoleIds) {
    const role = catalogById.get(roleId);
    if (!role) return { ok: false, code: "INSUFFICIENT_CARDS" };

    const occurrences = (requiredCounts.get(roleId) ?? 0) + 1;
    if (occurrences > role.cardCount) {
      return { ok: false, code: "INSUFFICIENT_CARDS", faction: role.faction };
    }
    requiredCounts.set(roleId, occurrences);
  }

  const candidatesByFaction = {} as Record<Faction, readonly Candidate[]>;

  for (const faction of ["town", "mafia", "neutral"] as const) {
    const count = factionCounts[faction];
    const available = catalog.filter((role) => role.faction === faction);
    const required = requiredRoleIds.filter(
      (roleId) => catalogById.get(roleId)?.faction === faction,
    );
    const candidates = buildFactionCandidates(available, count, required);

    if (candidates.length === 0) {
      return { ok: false, code: "INSUFFICIENT_CARDS", faction };
    }

    candidatesByFaction[faction] = candidates;
  }

  let bestRoleIds: readonly string[] | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const town of candidatesByFaction.town) {
    for (const mafia of candidatesByFaction.mafia) {
      for (const neutral of candidatesByFaction.neutral) {
        const roleIds = [
          ...town.roleIds,
          ...mafia.roleIds,
          ...neutral.roleIds,
        ];
        const distance = Math.abs(town.score + mafia.score + neutral.score);

        if (
          distance < bestDistance ||
          (distance === bestDistance &&
            bestRoleIds &&
            compareRoleLists(roleIds, bestRoleIds) < 0)
        ) {
          bestRoleIds = roleIds;
          bestDistance = distance;
        }
      }
    }
  }

  if (!bestRoleIds) return { ok: false, code: "INSUFFICIENT_CARDS" };

  return {
    ok: true,
    roleIds: bestRoleIds,
    virtueTotal: calculateRoleBalance(bestRoleIds, catalog).total,
  };
}
