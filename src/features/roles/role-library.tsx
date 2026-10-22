import Link from "next/link";

import { MAFIA_ROLES, NEUTRAL_ROLES, TOWN_ROLES } from "@/data/roles";
import type { RoleDefinition } from "@/types";

import { roleNameColor } from "./role-colors";

export const LIBRARY_FACTIONS = [
  { id: "town", label: "Cidade", color: "#3dd69b", blurb: "Descubra quem são os culpados e enforque-os antes que a cidade caia.", roles: TOWN_ROLES },
  { id: "mafia", label: "Máfia", color: "#db4242", blurb: "Mate quem se opõe a vocês até a família controlar a cidade.", roles: MAFIA_ROLES },
  { id: "neutral", label: "Neutros", color: "#c8c8c8", blurb: "Cada um joga pelo próprio objetivo, ao lado de quem convier.", roles: NEUTRAL_ROLES },
] as const;

interface RoleLibraryProps {
  /** Página: cada role é um link. Sem ele, onSelect abre a role no lugar. */
  linkRoles?: boolean;
  onSelect?: (role: RoleDefinition) => void;
  /** Roles desta partida, marcadas na lista. */
  highlightIds?: ReadonlySet<string>;
  /** Distância do topo onde as abas de facção grudam. */
  stickyTop?: string;
  className?: string;
}

/** Biblioteca em lista, pensada para o celular: abas de facção fixas e uma linha por role. */
export function RoleLibrary({ linkRoles = false, onSelect, highlightIds, stickyTop = "0px", className = "" }: RoleLibraryProps) {
  return (
    <div className={className}>
      <nav aria-label="Facções" style={{ top: stickyTop }} className="sticky z-20 -mx-4 grid grid-cols-3 border-b border-white/8 bg-[#111315]/95 px-2 backdrop-blur">
        {LIBRARY_FACTIONS.map(({ id, label, color, roles }) => (
          <a
            key={id}
            href={`#library-${id}`}
            className="flex min-h-12 items-center justify-center gap-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#c18b2f]"
            style={{ color }}
          >
            {label}
            <span className="text-xs font-normal text-[#8d877e] tabular-nums">{roles.length}</span>
          </a>
        ))}
      </nav>

      {LIBRARY_FACTIONS.map(({ id, label, color, blurb, roles }) => (
        <section key={id} id={`library-${id}`} aria-labelledby={`library-${id}-title`} style={{ scrollMarginTop: `calc(${stickyTop} + 3.5rem)` }} className="pt-6">
          <h2 id={`library-${id}-title`} className="font-serif text-2xl font-semibold" style={{ color }}>
            {label}
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#8d877e]">{blurb}</p>
          <ul className="mt-2">
            {roles.map((role) => {
              const roleColor = roleNameColor(role.id, id) ?? color;
              const inGame = highlightIds?.has(role.id);
              const body = (
                <>
                  <span aria-hidden="true" className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: roleColor }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-serif text-lg leading-6 font-semibold" style={{ color: roleColor }}>
                        {role.name}
                      </span>
                      {inGame && <span className="rounded-full bg-[#d3b88c]/15 px-2 text-[11px] leading-5 font-semibold text-[#f6dfb5]">Na partida</span>}
                    </span>
                    <span className="block truncate text-[13px] leading-5 text-[#9f9990]">{role.description}</span>
                  </span>
                  <span aria-hidden="true" className="text-lg text-[#5f5a54]">
                    ›
                  </span>
                </>
              );
              const rowClass = "flex min-h-16 w-full items-center gap-3 py-2 text-left transition-colors active:bg-white/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c18b2f]";
              return (
                <li key={role.id} className="border-b border-white/6 last:border-b-0">
                  {linkRoles ? (
                    <Link href={`/roles/${role.id}`} className={rowClass}>
                      {body}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => onSelect?.(role)} className={rowClass}>
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
