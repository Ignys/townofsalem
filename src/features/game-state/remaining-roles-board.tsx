"use client";

import { useMemo } from "react";

import { FACTION_LABELS } from "@/features/roles/role-presentation";
import { getRemainingRoleEntries } from "@/features/roles/remaining-roles";
import { FACTION_STYLES } from "@/features/roles/role-selection-options";
import type { GraveyardEntryRecord } from "@/lib/firebase/schema";

interface RemainingRolesBoardProps {
  roleComposition: Readonly<Record<string, number>> | null;
  graveyard: Readonly<Record<string, GraveyardEntryRecord>>;
}

/**
 * The roles from the composition nobody has seen die yet. A body cleaned by the
 * Janitor reveals nothing, so its role stays listed here.
 */
export function RemainingRolesBoard({ roleComposition, graveyard }: RemainingRolesBoardProps) {
  const entries = useMemo(
    () => getRemainingRoleEntries(roleComposition, graveyard),
    [graveyard, roleComposition],
  );

  if (!roleComposition || entries.length === 0) {
    return null;
  }

  const total = entries.reduce((sum, { count }) => sum + count, 0);

  return (
    <section className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
          Roles ainda em jogo
        </h2>
        <span className="text-sm font-bold text-[#e6cfa9]">{total}</span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {entries.map(({ role, count }) => {
          const style = FACTION_STYLES[role.faction] ?? FACTION_STYLES.neutral;
          return (
            <li
              key={role.id}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${style.tag}`}
              title={FACTION_LABELS[role.faction]}
            >
              {role.name}
              {count > 1 && <span className="font-bold tabular-nums">×{count}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
