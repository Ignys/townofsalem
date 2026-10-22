import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";
import { PlayerRoleCard } from "@/features/game-state/player-role-card";
import { RoleBonusRules } from "@/features/roles/role-bonus-rules";
import { BackToLibraryLink } from "@/features/roles/back-to-library-link";
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

  return (
    <main className="min-h-svh bg-[#111315] px-5 py-8 text-[#f8f1e5] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <BackToLibraryLink className="mb-7 inline-block text-sm font-semibold text-[#d3b88c] hover:text-[#e6cfa9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d3b88c]" />
        {/* playerCount 0: sem partida, não há limite de interação a mostrar. */}
        <PlayerRoleCard role={role} variants={NO_EXTRA_RULES} playerCount={0} />

        <RoleBonusRules roleId={role.id} />
      </div>
    </main>
  );
}
