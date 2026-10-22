import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";
import { PlayerRoleCard } from "@/features/game-state/player-role-card";
import { GuideSection } from "@/features/game-state/player-role-guide";
import { getAllRoleVariants } from "@/features/roles/active-role-variants";
import { DEFAULT_GAME_VARIANTS } from "@/game-engine/variants";

// Fora de uma partida nenhuma regra extra está valendo, nem as ligadas por padrão.
const NO_EXTRA_RULES = { ...DEFAULT_GAME_VARIANTS, doctorCannotSaveBodyguardSacrifice: false };

export function generateStaticParams() {
  return ROLE_DEFINITIONS.map((role) => ({ slug: role.id }));
}

export async function generateMetadata(
  props: PageProps<"/roles/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const role = getRoleById(slug);

  return role
    ? {
        title: `${role.name} | Enciclopédia de roles`,
        description: role.description,
      }
    : { title: "Role não encontrada" };
}

export default async function RolePage(props: PageProps<"/roles/[slug]">) {
  const { slug } = await props.params;
  const role = getRoleById(slug);

  if (!role) {
    notFound();
  }
  const bonusRules = getAllRoleVariants(role.id, DEFAULT_GAME_VARIANTS);

  return (
    <main className="min-h-svh bg-[#111315] px-5 py-8 text-[#f8f1e5] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/roles"
          className="mb-7 inline-block text-sm font-semibold text-[#d3b88c] hover:text-[#e6cfa9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d3b88c]"
        >
          ← Todas as roles
        </Link>
        {/* playerCount 0: sem partida, não há limite de interação a mostrar. */}
        <PlayerRoleCard role={role} variants={NO_EXTRA_RULES} playerCount={0} />

        {bonusRules.length > 0 && (
          <div className="mt-2.5">
            <GuideSection title="Regras bônus">
            <ul className="grid gap-2">
              {bonusRules.map((rule) => (
                <li key={rule} className="rounded-xl border-l-4 border-[#c18b2f]/60 bg-[#c18b2f]/8 py-2 pr-3 pl-3 text-sm leading-6 text-[#ece5d8]">
                  {rule}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[#a99c8a]">
              O mestre liga ou desliga cada uma ao criar a sala. Elas só valem quando estão ativas.
            </p>
            </GuideSection>
          </div>
        )}
      </div>
    </main>
  );
}
