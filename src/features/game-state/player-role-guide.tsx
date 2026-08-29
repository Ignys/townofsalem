import { getActiveRoleVariants } from "@/features/roles/active-role-variants";
import { RoleInteractionLimitNotice } from "@/features/roles/role-interaction-limit-notice";
import type { GameVariants } from "@/game-engine/variants";
import type { RoleDefinition } from "@/types";

interface PlayerRoleGuideProps {
  role: RoleDefinition;
  variants: GameVariants;
  playerCount: number;
}

export function PlayerRoleGuide({
  role,
  variants,
  playerCount,
}: PlayerRoleGuideProps) {
  const activeVariants = getActiveRoleVariants(role.id, variants);

  return (
    <section className="mt-4 rounded-2xl border border-[#d3b88c]/25 bg-[#d3b88c]/8 p-4">
      <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
        Como jogar esta role
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-[#e5ded2]">{role.description}</p>

      <RoleInteractionLimitNotice
        roleId={role.id}
        playerCount={playerCount}
      />

      {role.playTip && (
        <div className="mt-3 border-t border-[#d3b88c]/15 pt-3">
          <h3 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
            Dica prática
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-[#e5ded2]">{role.playTip}</p>
        </div>
      )}

      {activeVariants.length > 0 && (
        <div className="mt-3 rounded-xl border border-[#c18b2f]/35 bg-black/15 p-3">
          <h3 className="text-sm font-bold tracking-wide text-[#f0d19b] uppercase">
            {activeVariants.length === 1 ? "Variante ativa" : "Variantes ativas"}
          </h3>
          <p className="mt-1.5 text-xs leading-5 text-[#cfc7ba]">
            Nesta partida, aplique também {activeVariants.length === 1 ? "esta regra" : "estas regras"}:
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-[#fff3df]">
            {activeVariants.map((variant) => (
              <li key={variant}>{variant}</li>
            ))}
          </ul>
        </div>
      )}

      {role.importantInteractions.length > 0 && (
        <div className="mt-3 border-t border-[#d3b88c]/15 pt-3">
          <h3 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
            Interações importantes
          </h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-[#e5ded2]">
            {role.importantInteractions.map((interaction) => (
              <li key={interaction}>{interaction}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
