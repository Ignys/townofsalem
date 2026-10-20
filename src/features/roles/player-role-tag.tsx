import { getRoleById } from "@/data/roles";

import { FACTION_TAGS, roleTagStyle } from "@/features/game-state/game-composition-board";

interface PlayerRoleTagProps {
  roleId?: string;
  /** Sem role: a etiqueta mostra a facção inteira (ex.: "Máfia"). */
  faction?: "town" | "mafia" | "neutral";
  className?: string;
}

const FACTION_NAMES = { town: "Cidade", mafia: "Máfia", neutral: "Neutro" } as const;

export function PlayerRoleTag({ roleId, faction, className = "" }: PlayerRoleTagProps) {
  const role = roleId ? getRoleById(roleId) : undefined;
  const style = FACTION_TAGS[role?.faction ?? faction ?? "neutral"] ?? FACTION_TAGS.neutral;

  return (
    <span
      style={roleTagStyle(role?.id)}
      className={`inline-flex max-w-32 shrink-0 truncate rounded-md border px-1.5 py-px text-[0.6875rem] leading-4 font-medium uppercase ${style} ${className}`}
    >
      {role?.name ?? roleId ?? (faction ? FACTION_NAMES[faction] : "sem role")}
    </span>
  );
}
