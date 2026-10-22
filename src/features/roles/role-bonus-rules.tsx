import { GuideSection } from "@/features/game-state/player-role-guide";
import { DEFAULT_GAME_VARIANTS, type GameVariants } from "@/game-engine/variants";

import { getActiveRoleVariants, getAllRoleVariants } from "./active-role-variants";

/** Todas as regras bônus da role; com as variantes de uma sala, marca as que estão ligadas nela. */
export function RoleBonusRules({ roleId, roomVariants }: Readonly<{ roleId: string; roomVariants?: GameVariants }>) {
  const rules = getAllRoleVariants(roleId, DEFAULT_GAME_VARIANTS);
  if (rules.length === 0) return null;
  const active = roomVariants ? new Set(getActiveRoleVariants(roleId, roomVariants)) : null;

  return (
    <div className="mt-2.5">
      <GuideSection title="Regras bônus">
        <ul className="grid gap-2">
          {rules.map((rule) => {
            const on = active?.has(rule);
            return (
              <li
                key={rule}
                className={`rounded-xl border-l-4 py-2 pr-3 pl-3 text-sm leading-6 ${
                  active && !on ? "border-white/10 bg-white/[0.03] text-[#8d877e]" : "border-[#c18b2f]/60 bg-[#c18b2f]/8 text-[#ece5d8]"
                }`}
              >
                {active && (
                  <span className={`mb-0.5 block text-[11px] font-semibold ${on ? "text-[#f6dfb5]" : "text-[#6f6a63]"}`}>
                    {on ? "Ligada nesta sala" : "Desligada nesta sala"}
                  </span>
                )}
                {rule}
              </li>
            );
          })}
        </ul>
        {!active && <p className="mt-2 text-[#a99c8a]">O mestre liga ou desliga cada uma ao criar a sala. Elas só valem quando estão ativas.</p>}
      </GuideSection>
    </div>
  );
}
