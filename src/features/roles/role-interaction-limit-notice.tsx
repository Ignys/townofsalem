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
    <div className="mt-4 rounded-xl border border-[#6f9b77]/30 bg-[#6f9b77]/10 p-4">
      <h3 className="text-xs font-bold tracking-wide text-[#bfe0c5] uppercase">
        Limite nesta partida · {playerCount} {playerLabel}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#e5ded2]">
        {interactionLimit.description}
      </p>
      {resourceUsage && (
        <p className="mt-3 border-t border-[#6f9b77]/20 pt-3 text-sm font-bold text-[#bfe0c5]">
          Restantes: {resourceUsage.remaining} de {resourceUsage.limit}{" "}
          {resourceUsage.label}
        </p>
      )}
    </div>
  );
}
