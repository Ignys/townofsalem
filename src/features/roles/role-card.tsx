import Link from "next/link";

import type { RoleDefinition } from "@/types";

import { FACTION_LABELS, formatRoleAlignment } from "./role-presentation";

interface RoleCardProps {
  role: RoleDefinition;
}

export function RoleCard({ role }: RoleCardProps) {
  return (
    <li>
      <Link
        href={`/roles/${role.id}`}
        className="group block rounded-2xl border border-white/10 bg-[#1a1c1e] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:border-[#d3b88c]/40 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d3b88c]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-[#d3b88c] uppercase">
              {FACTION_LABELS[role.faction]}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-[#fffaf0]">
              {role.name}
            </h2>
          </div>
          <span
            aria-hidden="true"
            className="text-xl text-[#8f8a82] transition group-hover:translate-x-1 group-hover:text-[#e6cfa9]"
          >
            →
          </span>
        </div>
        <p className="mt-3 text-sm text-[#bdb7ad]">
          {formatRoleAlignment(role.alignment)}
        </p>
        <div className="mt-4 flex gap-2 text-xs font-semibold">
          <span className="rounded-full border border-[#d3b88c]/20 px-2.5 py-1 text-[#e6cfa9]">
            Virtue {role.virtueValue > 0 ? "+" : ""}{role.virtueValue}
          </span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[#bdb7ad]">
            {role.cardCount} carta{role.cardCount === 1 ? "" : "s"}
          </span>
        </div>
      </Link>
    </li>
  );
}
