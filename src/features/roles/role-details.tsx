import type { RoleDefinition } from "@/types";

import {
  FACTION_LABELS,
  formatRoleAlignment,
  getConfirmedCombatStats,
} from "./role-presentation";

interface RoleDetailsProps {
  role: RoleDefinition;
}

export function RoleDetails({ role }: RoleDetailsProps) {
  const combatStats = getConfirmedCombatStats(role);

  return (
    <article className="rounded-3xl border border-white/10 bg-[#1a1c1e] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-9">
      <header>
        <p className="text-xs font-bold tracking-[0.18em] text-[#d3b88c] uppercase">
          {FACTION_LABELS[role.faction]}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[#fffaf0] sm:text-5xl">
          {role.name}
        </h1>
        <p className="mt-3 text-sm font-medium text-[#bdb7ad]">
          {formatRoleAlignment(role.alignment)}
        </p>
      </header>

      <div className="mt-8 grid gap-7">
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <dt className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
              Virtue Value
            </dt>
            <dd className="mt-1 font-semibold text-[#fffaf0]">
              {role.virtueValue > 0 ? "+" : ""}{role.virtueValue}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <dt className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
              Cartas no baralho
            </dt>
            <dd className="mt-1 font-semibold text-[#fffaf0]">
              {role.cardCount}
            </dd>
          </div>
        </dl>
        <section>
          <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
            Objetivo
          </h2>
          <p className="mt-2 leading-7 text-[#e5ded2]">{role.goal}</p>
        </section>
        <section>
          <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
            Descrição
          </h2>
          <p className="mt-2 leading-7 text-[#e5ded2]">{role.description}</p>
        </section>
        {role.beginnerDescription && (
          <section className="rounded-2xl border border-[#d3b88c]/20 bg-[#d3b88c]/8 p-5">
            <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
              Para quem está começando
            </h2>
            <p className="mt-2 leading-7 text-[#e5ded2]">
              {role.beginnerDescription}
            </p>
          </section>
        )}
        {role.importantInteractions.length > 0 && (
          <section>
            <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
              Interações importantes
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-[#e5ded2]">
              {role.importantInteractions.map((interaction) => (
                <li key={interaction}>{interaction}</li>
              ))}
            </ul>
          </section>
        )}
        {combatStats.length > 0 && (
          <dl className="grid grid-cols-2 gap-3">
            {combatStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-black/15 p-4"
              >
                <dt className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-semibold text-[#fffaf0]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
