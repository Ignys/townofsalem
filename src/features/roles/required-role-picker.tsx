import { Ban, Check, Hash, Minus, Plus } from "lucide-react";

import { FACTIONS, type RoleDefinition } from "@/types";

import { FACTION_LABELS } from "./role-presentation";

/** "guarantee": pelo menos uma cópia; "exact": exatamente `count` cópias; "exclude": nenhuma. */
export type RoleRule = { mode: "guarantee" } | { mode: "exact"; count: number } | { mode: "exclude" };

interface RequiredRolePickerProps {
  roles: readonly RoleDefinition[];
  rules: Readonly<Record<string, RoleRule>>;
  selectedCount: number;
  playerCount: number;
  respectCardCount: boolean;
  onChange: (roleId: string, rule: RoleRule | null) => void;
}

const FACTION_ACCENTS: Record<string, { title: string; rail: string }> = {
  town: { title: "text-emerald-300", rail: "bg-emerald-400/70" },
  mafia: { title: "text-red-400", rail: "bg-red-500/70" },
  neutral: { title: "text-[#cfc9bf]", rail: "bg-gray-400/60" },
};

const ROW_TONE: Record<RoleRule["mode"] | "free", { row: string; name: string }> = {
  free: { row: "hover:bg-white/3", name: "text-[#d8d2c8]" },
  guarantee: { row: "bg-emerald-400/8", name: "font-semibold text-[#fffaf0]" },
  exact: { row: "bg-[#d3b88c]/9", name: "font-semibold text-[#fffaf0]" },
  exclude: { row: "bg-[#a33843]/10", name: "text-[#c98a90] line-through decoration-[#c98a90]/60" },
};

const iconButton =
  "grid size-7 place-items-center rounded-md transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a46a]/50 disabled:cursor-not-allowed disabled:opacity-25";

export function RequiredRolePicker({
  roles,
  rules,
  selectedCount,
  playerCount,
  respectCardCount,
  onChange,
}: RequiredRolePickerProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3 md:gap-4">
      {FACTIONS.map((faction) => (
        <section key={faction} aria-label={FACTION_LABELS[faction]}>
          <h4 className={`flex items-center gap-2 font-serif text-base font-semibold ${FACTION_ACCENTS[faction].title}`}>
            <span aria-hidden="true" className={`h-4 w-1 rounded-full ${FACTION_ACCENTS[faction].rail}`} />
            {FACTION_LABELS[faction]}
          </h4>
          <ul className="mt-2 grid gap-1">
            {roles
              .filter((role) => role.faction === faction)
              .map((role) => {
                const rule = rules[role.id];
                const mode = rule?.mode ?? "free";
                const slotsLeft = selectedCount < playerCount;
                const toggle = (next: RoleRule) => onChange(role.id, mode === next.mode ? null : next);

                return (
                  <li key={role.id} className={`flex min-h-10 items-center gap-0.5 rounded-lg pl-2.5 pr-1 transition-colors ${ROW_TONE[mode].row}`}>
                    <span className={`min-w-0 flex-1 truncate text-sm ${ROW_TONE[mode].name}`}>{role.name}</span>

                    {rule?.mode === "exact" ? (
                      <>
                        <button
                          type="button"
                          aria-label={`Uma cópia a menos de ${role.name}`}
                          disabled={rule.count <= 1}
                          onClick={() => onChange(role.id, { mode: "exact", count: rule.count - 1 })}
                          className={`${iconButton} text-[#d8d2c8]`}
                        >
                          <Minus aria-hidden="true" className="size-3.5" />
                        </button>
                        <span className="w-4 text-center text-sm font-bold text-[#e6cfa9] tabular-nums" aria-label={`Exatamente ${rule.count}`}>
                          {rule.count}
                        </span>
                        <button
                          type="button"
                          aria-label={`Uma cópia a mais de ${role.name}`}
                          disabled={!slotsLeft || (respectCardCount && rule.count >= role.cardCount)}
                          onClick={() => onChange(role.id, { mode: "exact", count: rule.count + 1 })}
                          className={`${iconButton} text-[#d8d2c8]`}
                        >
                          <Plus aria-hidden="true" className="size-3.5" />
                        </button>
                      </>
                    ) : null}

                    <button
                      type="button"
                      aria-pressed={mode === "guarantee"}
                      aria-label={`Garantir ${role.name} na partida`}
                      title="Garantir: pelo menos uma"
                      disabled={mode !== "guarantee" && mode !== "exact" && !slotsLeft}
                      onClick={() => toggle({ mode: "guarantee" })}
                      className={`${iconButton} ${mode === "guarantee" ? "bg-emerald-400/15 text-emerald-300" : "text-[#6f6a63] hover:text-emerald-300"}`}
                    >
                      <Check aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-pressed={mode === "exact"}
                      aria-label={`Definir quantas ${role.name} terão`}
                      title="Quantidade exata"
                      disabled={mode !== "guarantee" && mode !== "exact" && !slotsLeft}
                      onClick={() => toggle({ mode: "exact", count: 1 })}
                      className={`${iconButton} ${mode === "exact" ? "bg-[#d3b88c]/15 text-[#e6cfa9]" : "text-[#6f6a63] hover:text-[#e6cfa9]"}`}
                    >
                      <Hash aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-pressed={mode === "exclude"}
                      aria-label={`Deixar ${role.name} de fora`}
                      title="Deixar de fora"
                      onClick={() => toggle({ mode: "exclude" })}
                      className={`${iconButton} ${mode === "exclude" ? "bg-[#a33843]/20 text-[#f0b9bd]" : "text-[#6f6a63] hover:text-[#f0b9bd]"}`}
                    >
                      <Ban aria-hidden="true" className="size-3.5" />
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
