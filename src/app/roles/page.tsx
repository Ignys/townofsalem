import type { Metadata } from "next";
import Link from "next/link";

import { roleNameColor } from "@/features/roles/role-colors";
import { LibraryVisitMark } from "@/features/roles/back-to-library-link";
import { LIBRARY_FACTIONS as FACTIONS, RoleLibrary } from "@/features/roles/role-library";

export const metadata: Metadata = {
  title: "Enciclopédia de roles | Town of Salem",
  description: "Consulte as roles disponíveis no companion.",
};

export default function RolesPage() {
  return (
    <main className="min-h-svh bg-[#111315] bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(211,184,140,0.12),transparent)] px-4 py-8 text-[#efe3cf] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[#d3b88c] hover:text-[#e6cfa9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d3b88c]"
        >
          ← Voltar ao início
        </Link>

        <header className="mt-10 text-center max-sm:mt-6">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-[#fffaf0] max-sm:text-[2.75rem] sm:text-6xl">
            Biblioteca
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-7 text-[#bdb7ad] max-sm:mt-2 max-sm:text-sm max-sm:leading-6">
            Todas as roles que usamos em nossos jogos, com seus objetivos e habilidades.
          </p>
          <nav aria-label="Facções" className="mt-7 flex justify-center gap-2 max-sm:hidden">
            {FACTIONS.map(({ id, label, color, roles }) => (
              <a
                key={id}
                href={`#${id}`}
                style={{ color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
                className="rounded-full border px-4 py-1.5 text-sm font-semibold hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#c18b2f]"
              >
                {label} <span className="font-normal opacity-60">{roles.length}</span>
              </a>
            ))}
          </nav>
        </header>

        {/* Celular: lista com abas fixas; PC: cards em duas colunas. */}
        <LibraryVisitMark />
        <RoleLibrary linkRoles className="mt-6 sm:hidden" />

        {FACTIONS.map(({ id, label, color, blurb, roles }) => (
          <section key={id} id={id} className="mt-16 scroll-mt-6 max-sm:hidden">
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl" style={{ color }}>
                {label}
              </h2>
              <span aria-hidden="true" className="h-px flex-1" style={{ background: `linear-gradient(to right, color-mix(in srgb, ${color} 45%, transparent), transparent)` }} />
            </div>
            <p className="mt-2 text-sm leading-6 text-[#a99c8a]">{blurb}</p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {roles.map((role) => {
                const roleColor = roleNameColor(role.id, id) ?? color;
                return (
                  <li key={role.id}>
                    <Link
                      href={`/roles/${role.id}`}
                      style={{
                        backgroundColor: `color-mix(in srgb, ${roleColor} 5%, #16181a)`,
                        borderColor: `color-mix(in srgb, ${roleColor} 18%, transparent)`,
                        // Usada pelo hover para acender a borda na cor da role.
                        ["--role" as string]: roleColor,
                      }}
                      className="group relative block h-full overflow-hidden rounded-xl border py-4 pr-4 pl-5 transition-colors hover:border-[color-mix(in_srgb,var(--role)_55%,transparent)]! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c18b2f]"
                    >
                      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: roleColor }} />
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-serif text-xl font-semibold" style={{ color: roleColor }}>
                          {role.name}
                        </span>
                        <span aria-hidden="true" className="text-[#6b6560] transition-transform group-hover:translate-x-0.5 group-hover:text-[#d3b88c]">›</span>
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-sm leading-6 text-[#b3a693]">{role.goal}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
