"use client";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { RANDOM_ROLE_SLOTS } from "@/features/roles/random-role-slots";
import { FACTION_STYLES } from "@/features/roles/role-selection-options";

interface GameCompositionBoardProps {
  roleComposition: Readonly<Record<string, number>> | null;
}

/**
 * The composition as it was dealt, never shrinking as people die: with a Janitor
 * around there is no honest way to tell which card left the table. Random slots
 * stay as slots, so nobody learns what they rolled.
 */
export function GameCompositionBoard({ roleComposition }: GameCompositionBoardProps) {
  if (!roleComposition) {
    return null;
  }

  const entries = [...ROLE_DEFINITIONS, ...RANDOM_ROLE_SLOTS].flatMap((entry) => {
    const count = roleComposition[entry.id] ?? 0;
    return count > 0 ? [{ ...entry, count }] : [];
  });
  const total = entries.reduce((sum, { count }) => sum + count, 0);

  if (total === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
          Composição do jogo
        </h2>
        <span className="text-sm font-bold text-[#e6cfa9]">{total}</span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {entries.map(({ id, name, faction, count }) => (
          <li
            key={id}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${FACTION_STYLES[faction ?? "neutral"].tag}`}
          >
            {name}
            {count > 1 && <span className="font-bold tabular-nums">×{count}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
