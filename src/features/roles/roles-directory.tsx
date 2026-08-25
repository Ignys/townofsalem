import type { RoleDefinition } from "@/types";

import { groupRolesByFactionAndAlignment } from "./group-roles";
import { RoleCard } from "./role-card";
import { FACTION_LABELS, formatRoleAlignment } from "./role-presentation";

interface RolesDirectoryProps {
  roles: readonly RoleDefinition[];
}

export function RolesDirectory({ roles }: RolesDirectoryProps) {
  const groups = groupRolesByFactionAndAlignment(roles);

  return (
    <div className="grid gap-10">
      {groups.map((factionGroup) => (
        <section key={factionGroup.faction}>
          <h2 className="font-serif text-3xl font-semibold text-[#fffaf0]">
            {FACTION_LABELS[factionGroup.faction]}
          </h2>
          <div className="mt-5 grid gap-7">
            {factionGroup.alignments.map((alignmentGroup) => (
              <div key={alignmentGroup.alignment}>
                <h3 className="text-sm font-semibold text-[#bdb7ad]">
                  {formatRoleAlignment(alignmentGroup.alignment)}
                </h3>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {alignmentGroup.roles.map((role) => (
                    <RoleCard key={role.id} role={role} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
