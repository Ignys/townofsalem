"use client";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { RANDOM_ROLE_SLOTS } from "@/features/roles/random-role-slots";

// Cores cheias por facção: a facção tem que saltar aos olhos no pergaminho.
export const FACTION_TAGS: Record<string, string> = {
  town: "border-[#052603] bg-[#052603] text-[#3ce667]",
  mafia: "border-[#401010] bg-[#401010] text-[#db4242]",
  neutral: "border-[#303030] bg-[#303030] text-white",
};

/** Cores das roles neutras do jogo digital; tags de categoria ("Neutro") seguem cinza. */
export const NEUTRAL_ROLE_COLORS: Record<string, string> = {
  "serial-killer": "#4d6bff", // #000080 no jogo, clareado para leitura no fundo escuro
  werewolf: "#b0703f", // #784421 clareado
  jester: "#f5a6d4",
  executioner: "#acacac",
  witch: "#bf5fff",
  amnesiac: "#22ffff",
  vampire: "#9aab84", // #7B8968 clareado
};

/** Cor do nome da role: própria para neutras, da facção para Cidade e Máfia. */
export function roleNameColor(roleId: string, faction?: string | null) {
  return NEUTRAL_ROLE_COLORS[roleId] ?? (faction === "town" ? "#3dd69b" : faction === "mafia" ? "#db4242" : undefined);
}

export function roleTagStyle(roleId?: string) {
  const color = roleId ? NEUTRAL_ROLE_COLORS[roleId] : undefined;
  if (!color) return undefined;
  const bg = `color-mix(in srgb, ${color} 22%, #111)`;
  return { color, backgroundColor: bg, borderColor: bg };
}

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
    <section className="panel-public">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-base font-semibold">Composição do jogo</h2>
        <span className="rounded-full bg-[#e4d6bf] px-3 py-0.5 text-sm font-bold text-[#3b2a22]">
          {total}
        </span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {entries.map(({ id, name, faction, count }) => (
          <li
            key={id}
            style={roleTagStyle(id)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-px text-[0.6875rem] leading-4 font-medium uppercase ${FACTION_TAGS[faction ?? "neutral"] ?? FACTION_TAGS.neutral}`}
          >
            {name}
            {count > 1 && <span className="font-bold tabular-nums">×{count}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
