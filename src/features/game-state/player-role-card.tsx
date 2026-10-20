"use client";

import type { ReactNode } from "react";

import type { GameVariants } from "@/game-engine/variants";
import type { RoleDefinition } from "@/types";

import { NEUTRAL_ROLE_COLORS } from "./game-composition-board";
import { PlayerRoleGuide } from "./player-role-guide";

// Mesmas cores do texto das etiquetas de facção da composição.
const FACTION_NAME_COLORS: Record<string, string> = {
  town: "text-[#3ce667]",
  mafia: "text-[#db4242]",
  neutral: "text-[#c8c8c8]",
};

const FACTION_NAMES: Record<string, string> = { town: "Cidade", mafia: "Máfia", neutral: "Neutro" };

// Brilho suave atrás do nome, na cor da facção.
const FACTION_GLOWS: Record<string, string> = {
  town: "bg-[#3ce667]/14",
  mafia: "bg-[#db4242]/16",
  neutral: "bg-[#c8c8c8]/10",
};

interface PlayerRoleCardProps {
  role: RoleDefinition;
  variants: GameVariants;
  playerCount: number;
  secrets?: ReactNode;
}

/** The private role sheet. Only ever rendered while the player holds the reveal button. */
export function PlayerRoleCard({ role, variants, playerCount, secrets }: PlayerRoleCardProps) {
  const roleColor = NEUTRAL_ROLE_COLORS[role.id];
  return (
    <article className="mx-auto w-full max-w-xl">
      <header className="relative pt-3 text-center">
        <div
          aria-hidden="true"
          style={roleColor ? { backgroundColor: `color-mix(in srgb, ${roleColor} 16%, transparent)` } : undefined}
          className={`pointer-events-none absolute top-0 left-1/2 h-20 w-60 -translate-x-1/2 rounded-full blur-3xl ${
            FACTION_GLOWS[role.faction] ?? FACTION_GLOWS.neutral
          }`}
        />
        <h1
          style={roleColor ? { color: roleColor } : undefined}
          className={`relative text-4xl leading-tight font-bold tracking-tight ${
            FACTION_NAME_COLORS[role.faction] ?? FACTION_NAME_COLORS.neutral
          }`}
        >
          {role.name}
        </h1>
        <p
          className={`relative mt-1 text-sm font-semibold tracking-[0.2em] uppercase ${
            FACTION_NAME_COLORS[role.faction] ?? FACTION_NAME_COLORS.neutral
          }`}
        >
          {FACTION_NAMES[role.faction] ?? "Neutro"}
        </p>
      </header>

      <PlayerRoleGuide
        role={role}
        variants={variants}
        playerCount={playerCount}
        secrets={secrets}
      />
    </article>
  );
}
