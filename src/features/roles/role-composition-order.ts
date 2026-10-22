import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";
import type { Faction } from "@/types";

import { getRandomRoleSlot } from "./random-role-slots";

export type RoleCompositionOrder = "natural" | "virtue";

export interface OrderedRoleSelection {
  roleId: string;
  originalIndex: number;
}

const FACTION_ORDER: Record<Faction, number> = {
  town: 0,
  mafia: 1,
  neutral: 2,
};

const NATURAL_ROLE_ORDER = new Map<string, number>(
  ROLE_DEFINITIONS.map((role, index) => [role.id, index]),
);

function compareNaturalOrder(
  first: OrderedRoleSelection,
  second: OrderedRoleSelection,
): number {
  const [firstRank, secondRank] = [first, second].map(naturalRank);

  for (let index = 0; index < firstRank.length; index += 1) {
    const difference = firstRank[index] - secondRank[index];
    if (difference !== 0) return difference;
  }

  return first.originalIndex - second.originalIndex;
}

// [faction, random slot after fixed roles, position]; "Aleatório" (any faction) goes last.
function naturalRank({ roleId }: OrderedRoleSelection): number[] {
  const role = getRoleById(roleId);
  if (role) {
    return [FACTION_ORDER[role.faction], 0, NATURAL_ROLE_ORDER.get(roleId) ?? Number.MAX_SAFE_INTEGER];
  }

  const slot = getRandomRoleSlot(roleId);
  if (slot) {
    return [slot.faction ? FACTION_ORDER[slot.faction] : 3, 1, 0];
  }

  return [4, 0, 0];
}

export function orderSelectedRoles(
  roleIds: readonly string[],
  order: RoleCompositionOrder,
): OrderedRoleSelection[] {
  return roleIds
    .map((roleId, originalIndex) => ({ roleId, originalIndex }))
    .sort((first, second) => {
      if (order === "virtue") {
        const firstVirtue = getRoleById(first.roleId)?.virtueValue;
        const secondVirtue = getRoleById(second.roleId)?.virtueValue;

        if (firstVirtue !== undefined && secondVirtue !== undefined) {
          const virtueDifference = secondVirtue - firstVirtue;

          if (virtueDifference !== 0) {
            return virtueDifference;
          }
        }
      }

      return compareNaturalOrder(first, second);
    });
}
