import { getRoleInteractionLimit } from "./role-interaction-limit";
import type { RoleResourceUsage } from "./role-resource-usage";

interface RoleInteractionLimitNoticeProps {
  roleId: string;
  playerCount: number;
  resourceUsage?: RoleResourceUsage | null;
}

export function RoleInteractionLimitNotice({
  roleId,
  playerCount,
  resourceUsage,
}: RoleInteractionLimitNoticeProps) {
  const interactionLimit = getRoleInteractionLimit(roleId, playerCount);
  if (!interactionLimit) return null;
  const playerLabel = playerCount === 1 ? "jogador" : "jogadores";

  return (
    <div className="rounded-xl border-l-4 border-[#6f9b77] bg-[#6f9b77]/10 py-2 pr-3 pl-3">
      <h3 className="text-xs font-semibold text-[#bfe0c5]">
        Limite nesta partida · {playerCount} {playerLabel}
      </h3>
      <p className="mt-1 text-sm leading-6 text-[#e5ded2]">
        {interactionLimit.description}
      </p>
      {resourceUsage && (
        <p className="mt-2 border-t border-[#6f9b77]/20 pt-2 text-sm font-bold text-[#bfe0c5]">
          Restantes: {resourceUsage.remaining} de {resourceUsage.limit}{" "}
          {resourceUsage.label}
        </p>
      )}
    </div>
  );
}
