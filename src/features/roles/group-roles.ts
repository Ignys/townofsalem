import type { Faction, RoleDefinition } from "@/types";

export interface RoleAlignmentGroup {
  alignment: string;
  roles: readonly RoleDefinition[];
}

export interface RoleFactionGroup {
  faction: Faction;
  alignments: readonly RoleAlignmentGroup[];
}

export function groupRolesByFactionAndAlignment(
  roles: readonly RoleDefinition[],
): readonly RoleFactionGroup[] {
  const factionGroups = new Map<Faction, Map<string, RoleDefinition[]>>();

  roles.forEach((role) => {
    const alignmentGroups = factionGroups.get(role.faction) ?? new Map();
    const alignmentRoles = alignmentGroups.get(role.alignment) ?? [];

    alignmentRoles.push(role);
    alignmentGroups.set(role.alignment, alignmentRoles);
    factionGroups.set(role.faction, alignmentGroups);
  });

  return Array.from(factionGroups, ([faction, alignments]) => ({
    faction,
    alignments: Array.from(alignments, ([alignment, groupedRoles]) => ({
      alignment,
      roles: groupedRoles,
    })),
  }));
}
