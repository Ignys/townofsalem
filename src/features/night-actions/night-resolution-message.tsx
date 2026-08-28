import { PlayerRoleTag } from "@/features/roles/player-role-tag";

import type { NightResolutionMessageLine } from "./night-resolution-message-types";

interface NightResolutionMessageProps {
  line: NightResolutionMessageLine;
  onPlayerClick?: (playerUid: string) => void;
}

export function NightResolutionMessage({
  line,
  onPlayerClick,
}: NightResolutionMessageProps) {
  return line.parts.map((part, index) => {
    const key = part.kind === "role"
      ? `${index}:role:${part.roleId}`
      : `${index}:${part.kind}:${part.text}`;

    if (part.kind === "role") {
      return <PlayerRoleTag key={key} roleId={part.roleId} className="mx-1 align-middle" />;
    }

    if (part.kind === "player" && onPlayerClick) {
      return (
        <button
          key={key}
          type="button"
          onClick={() => onPlayerClick(part.playerUid)}
          className={`rounded-sm font-semibold underline decoration-dotted underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${part.tone === "danger" ? "text-red-400" : "text-sky-100"}`}
          title={part.tone === "danger" ? "Suspeito verdadeiro" : `Abrir detalhes de ${part.text}`}
        >
          {part.text}
        </button>
      );
    }

    return (
      <span
        key={key}
        className={part.tone === "danger" ? "font-bold text-red-400" : undefined}
        title={part.tone === "danger" ? "Suspeito verdadeiro" : undefined}
      >
        {part.text}
      </span>
    );
  });
}
