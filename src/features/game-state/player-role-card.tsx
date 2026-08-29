"use client";

import {
  FACTION_LABELS,
  formatRoleAlignment,
} from "@/features/roles/role-presentation";
import type { GameVariants } from "@/game-engine/variants";
import type { RoleDefinition } from "@/types";

import { PlayerRoleGuide } from "./player-role-guide";

interface PlayerRoleCardProps {
  role: RoleDefinition;
  variants: GameVariants;
  playerCount: number;
}

/** The private role sheet. Only ever rendered while the player holds the reveal button. */
export function PlayerRoleCard({ role, variants, playerCount }: PlayerRoleCardProps) {
  return (
    <article className="mx-auto w-full max-w-xl">
      <header className="text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">
          Sua role secreta
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight font-semibold tracking-tight text-[#fffaf0]">
          {role.name}
        </h1>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full border border-[#d3b88c]/30 bg-[#d3b88c]/10 px-3 py-1 font-bold text-[#e6cfa9]">
            {FACTION_LABELS[role.faction]}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[#bdb7ad]">
            {formatRoleAlignment(role.alignment)}
          </span>
        </div>
      </header>

      <section className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
          Seu objetivo
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-[#e5ded2]">{role.goal}</p>
      </section>

      <PlayerRoleGuide
        role={role}
        variants={variants}
        playerCount={playerCount}
      />
    </article>
  );
}
