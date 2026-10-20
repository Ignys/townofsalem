import { PlayerRoleTag } from "@/features/roles/player-role-tag";

import type { NightResolutionMessageLine } from "./night-resolution-message-types";

interface NightResolutionMessageProps {
  line: NightResolutionMessageLine;
  onPlayerClick?: (playerUid: string) => void;
  /** Fundo claro (pergaminho): cores escuras para manter o contraste. */
  light?: boolean;
}

export function NightResolutionMessage({
  line,
  onPlayerClick,
  light = false,
}: NightResolutionMessageProps) {
  return line.parts.map((part, index) => {
    const key = part.kind === "role"
      ? `${index}:role:${part.roleId}`
      : part.kind === "faction"
        ? `${index}:faction:${part.faction}`
        : `${index}:${part.kind}:${part.text}`;

    if (part.kind === "role" || part.kind === "faction") {
      const tag = part.kind === "role"
        ? { roleId: part.roleId }
        : { faction: part.faction };
      return <PlayerRoleTag key={key} {...tag} className="mx-1 align-middle" />;
    }

    if (part.kind === "player" && onPlayerClick) {
      return (
        <button
          key={key}
          type="button"
          onClick={() => onPlayerClick(part.playerUid)}
          className={`rounded-sm font-semibold underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 ${light ? "hover:text-black focus-visible:outline-[#7d2330]" : "hover:text-white focus-visible:outline-amber-400"} ${part.tone === "danger" ? (light ? "text-[#7d2330]" : "text-red-400") : (light ? "text-[#34405e]" : "text-sky-100")}`}
          title={part.tone === "danger" ? "Suspeito verdadeiro" : `Abrir detalhes de ${part.text}`}
        >
          {part.text}
        </button>
      );
    }

    return (
      <span
        key={key}
        className={part.tone === "danger" ? `font-bold ${light ? "text-[#7d2330]" : "text-red-400"}` : undefined}
        title={part.tone === "danger" ? "Suspeito verdadeiro" : undefined}
      >
        {part.text}
      </span>
    );
  });
}
