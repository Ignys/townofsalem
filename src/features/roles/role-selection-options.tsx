import type { RoleDefinition } from "@/types";

import { groupRolesByFactionAndAlignment } from "./group-roles";
import { FACTION_LABELS, formatRoleAlignment } from "./role-presentation";

interface RoleSelectionOptionsProps {
  roles: readonly RoleDefinition[];
  selectedRoleCounts: Readonly<Record<string, number>>;
  allowDuplicateRoleIds: boolean;
  disabled: boolean;
  onAdd: (roleId: string) => void;
}

export function RoleSelectionOptions({
  roles,
  selectedRoleCounts,
  allowDuplicateRoleIds,
  disabled,
  onAdd,
}: RoleSelectionOptionsProps) {
  const groups = groupRolesByFactionAndAlignment(roles);

  return (
    <div className="grid gap-6">
      {groups.map((factionGroup) => (
        <section key={factionGroup.faction}>
          <h3 className="font-serif text-xl font-semibold text-[#fffaf0]">
            {FACTION_LABELS[factionGroup.faction]}
          </h3>
          <div className="mt-3 grid gap-4">
            {factionGroup.alignments.map((alignmentGroup) => (
              <div key={alignmentGroup.alignment}>
                <h4 className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
                  {formatRoleAlignment(alignmentGroup.alignment)}
                </h4>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {alignmentGroup.roles.map((role) => {
                    const selectedCount = selectedRoleCounts[role.id] ?? 0;
                    const unavailable =
                      (!allowDuplicateRoleIds && selectedCount > 0) ||
                      selectedCount >= role.cardCount;

                    return (
                      <li key={role.id}>
                        <button
                          type="button"
                          onClick={() => onAdd(role.id)}
                          disabled={disabled || unavailable}
                          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-2 text-left font-semibold text-[#f8f1e5] transition hover:border-[#d3b88c]/45 hover:bg-[#d3b88c]/8 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span>
                            {role.name}
                            <span className="ml-2 text-xs font-normal text-[#9f9990]">
                              {selectedCount}/{role.cardCount}
                            </span>
                          </span>
                          <span className="text-xs text-[#d3b88c]">
                            {unavailable ? "Limite atingido" : "+ Adicionar"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
