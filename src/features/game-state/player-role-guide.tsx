import type { ReactNode } from "react";

import { getActiveRoleVariants } from "@/features/roles/active-role-variants";
import { RoleInteractionLimitNotice } from "@/features/roles/role-interaction-limit-notice";
import type { GameVariants } from "@/game-engine/variants";
import type { RoleDefinition } from "@/types";

interface PlayerRoleGuideProps {
  role: RoleDefinition;
  variants: GameVariants;
  playerCount: number;
  /** Segredos do jogador (ex.: a equipe da Máfia), logo depois do objetivo. */
  secrets?: ReactNode;
}

export function GuideSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="border-t border-white/8 pt-2.5">
      <h2 className="text-xs font-semibold text-[#9f9990]">{title}</h2>
      <div className="mt-1 text-sm leading-6 text-[#ece5d8]">{children}</div>
    </section>
  );
}

export function PlayerRoleGuide({
  role,
  variants,
  playerCount,
  secrets,
}: PlayerRoleGuideProps) {
  const activeVariants = getActiveRoleVariants(role.id, variants);

  return (
    <div className="mt-4 grid gap-2.5 text-left">
      <GuideSection title="Objetivo">
        <p>{role.goal}</p>
      </GuideSection>

      {secrets}

      <GuideSection title="Como jogar">
        <p>{role.description}</p>
      </GuideSection>

      {role.importantInteractions.length > 0 && (
        <GuideSection title="Interações importantes">
          <ul className="list-disc space-y-0.5 pl-5 marker:text-[#6b6560]">
            {role.importantInteractions.map((interaction) => (
              <li key={interaction}>{interaction}</li>
            ))}
          </ul>
        </GuideSection>
      )}

      <RoleInteractionLimitNotice roleId={role.id} playerCount={playerCount} />

      {role.playTip && (
        <GuideSection title="Dica">
          <p>{role.playTip}</p>
        </GuideSection>
      )}

      {activeVariants.length > 0 && (
        <section className="border-t border-white/8 pt-2.5">
          <h2 className="text-xs font-semibold text-[#f0d19b]">
            {activeVariants.length === 1 ? "Regra extra nesta partida" : "Regras extras nesta partida"}
          </h2>
          {/* Uma carta por variante: cada regra vale por si. */}
          <ul className="mt-2 grid gap-2">
            {activeVariants.map((variant) => (
              <li
                key={variant}
                className="rounded-xl border-l-4 border-[#c18b2f] bg-[#c18b2f]/10 py-2 pr-3 pl-3 text-sm leading-6 text-[#fff3df]"
              >
                {variant}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
