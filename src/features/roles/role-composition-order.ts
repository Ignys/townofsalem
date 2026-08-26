import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";
import type { Faction } from "@/types";

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
  const firstRole = getRoleById(first.roleId);
  const secondRole = getRoleById(second.roleId);

  if (!firstRole || !secondRole) {
    if (firstRole) return -1;
    if (secondRole) return 1;
    return first.originalIndex - second.originalIndex;
  }

  const factionDifference =
    FACTION_ORDER[firstRole.faction] - FACTION_ORDER[secondRole.faction];

  if (factionDifference !== 0) {
    return factionDifference;
  }

  return (
    (NATURAL_ROLE_ORDER.get(first.roleId) ?? Number.MAX_SAFE_INTEGER) -
    (NATURAL_ROLE_ORDER.get(second.roleId) ?? Number.MAX_SAFE_INTEGER)
  );
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
