import type { Metadata } from "next";
import Link from "next/link";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { RolesDirectory } from "@/features/roles/roles-directory";

export const metadata: Metadata = {
  title: "Enciclopédia de roles | Town of Salem",
  description: "Consulte as roles disponíveis no companion.",
};

export default function RolesPage() {
  return (
    <main className="min-h-svh bg-[#111315] px-5 py-8 text-[#f8f1e5] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[#d3b88c] hover:text-[#e6cfa9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d3b88c]"
        >
          ← Voltar ao início
        </Link>
        <header className="my-9 max-w-2xl">
          <p className="text-xs font-bold tracking-[0.18em] text-[#d3b88c] uppercase">
            Consulta pública
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#fffaf0] sm:text-5xl">
            Enciclopédia de roles
          </h1>
          <p className="mt-4 leading-7 text-[#bdb7ad]">
            Conheça objetivos e orientações das roles disponíveis antes de
            começar uma partida.
          </p>
        </header>
        <RolesDirectory roles={ROLE_DEFINITIONS} />
      </div>
    </main>
  );
}
