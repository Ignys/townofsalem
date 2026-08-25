import type { Faction, RoleDefinition } from "@/types";

import { MAFIA_ROLES } from "./mafia";
import { NEUTRAL_ROLES } from "./neutral";
import { TOWN_ROLES } from "./town";

export const ROLE_DEFINITIONS = [
  ...TOWN_ROLES,
  ...MAFIA_ROLES,
  ...NEUTRAL_ROLES,
] as const satisfies readonly RoleDefinition[];

export type RoleId = (typeof ROLE_DEFINITIONS)[number]["id"];

const rolesById = new Map<string, RoleDefinition>(
  ROLE_DEFINITIONS.map((role) => [role.id, role]),
);

export function getRoleById(roleId: string): RoleDefinition | undefined {
  return rolesById.get(roleId);
}

export function getRolesByFaction(
  faction: Faction,
): readonly RoleDefinition[] {
  return ROLE_DEFINITIONS.filter((role) => role.faction === faction);
}

export function isValidRoleId(roleId: string): roleId is RoleId {
  return rolesById.has(roleId);
}

export { MAFIA_ROLES, NEUTRAL_ROLES, TOWN_ROLES };
