import { FACTIONS, type RoleDefinition } from "@/types";

import { FACTION_LABELS } from "./role-presentation";
import { FACTION_STYLES } from "./role-selection-options";

interface RequiredRolePickerProps {
  roles: readonly RoleDefinition[];
  selectedRoleCounts: Readonly<Record<string, number>>;
  selectedCount: number;
  playerCount: number;
  onChange: (roleId: string, count: number) => void;
}

export function RequiredRolePicker({
  roles,
  selectedRoleCounts,
  selectedCount,
  playerCount,
  onChange,
}: RequiredRolePickerProps) {
  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-[#f8f1e5]">
            Roles obrigatórias
          </h4>
          <p className="mt-1 text-xs leading-5 text-[#9f9990]">
            O gerador completa as vagas restantes buscando o melhor equilíbrio.
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-[#d3b88c]">
          {selectedCount}/{playerCount}
        </span>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {FACTIONS.map((faction) => (
          <section key={faction}>
            <h5
              className={`rounded-lg border px-2 py-1 text-xs font-bold tracking-wide uppercase ${FACTION_STYLES[faction].tag}`}
            >
              {FACTION_LABELS[faction]}
            </h5>
            <ul className="mt-2 grid gap-1.5">
              {roles
                .filter((role) => role.faction === faction)
                .map((role) => {
                  const count = selectedRoleCounts[role.id] ?? 0;
                  const cannotAdd =
                    count >= role.cardCount || selectedCount >= playerCount;

                  return (
                    <li
                      key={role.id}
                      className="flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/15 px-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#f8f1e5]">
                        {role.name}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remover ${role.name} das roles obrigatórias`}
                        disabled={count === 0}
                        onClick={() => onChange(role.id, count - 1)}
                        className="grid size-7 place-items-center rounded-md border border-white/10 text-base text-[#d8d2c8] hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        −
                      </button>
                      <span
                        className="w-4 text-center text-xs font-bold text-[#d3b88c]"
                        aria-label={`${count} selecionada${count === 1 ? "" : "s"}`}
                      >
                        {count}
                      </span>
                      <button
                        type="button"
                        aria-label={`Adicionar ${role.name} às roles obrigatórias`}
                        disabled={cannotAdd}
                        onClick={() => onChange(role.id, count + 1)}
                        className="grid size-7 place-items-center rounded-md border border-white/10 text-base text-[#d8d2c8] hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        +
                      </button>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
