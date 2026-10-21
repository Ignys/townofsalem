import { NEW_ROLE_IDS } from "@/data/roles";
import type { RoleDefinition } from "@/types";

import { NEUTRAL_ROLE_COLORS, roleNameColor } from "@/features/game-state/game-composition-board";
import { FACTION_LABELS } from "./role-presentation";

interface RoleSelectionOptionsProps {
    roles: readonly RoleDefinition[];
    selectedRoleCounts: Readonly<Record<string, number>>;
    allowDuplicateRoleIds: boolean;
    respectCardCount: boolean;
    disabled: boolean;
    onAdd: (roleId: string) => void;
}

export const FACTION_STYLES: Record<string, { tag: string; card: string }> = {
    town: {
        tag: "border-emerald-400/40 bg-emerald-400/15 text-emerald-300",
        card: "border-emerald-400/35 bg-emerald-800/15 hover:border-emerald-300/50 hover:bg-emerald-400/10",
    },
    mafia: {
        tag: "border-red-500/40 bg-red-500/15 text-red-400",
        card: "border-red-500/25 bg-red-950/15 hover:border-red-400/50 hover:bg-red-500/8",
    },
    neutral: {
        tag: "border-gray-400/40 bg-gray-400/15 text-gray-300",
        card: "border-gray-400/25 bg-gray-800/15 hover:border-gray-300/50 hover:bg-gray-400/8",
    },
};

// Faixa da facção na borda esquerda: a cor diz o lado sem repetir o nome em cada carta.
const FACTION_STRIPES: Record<string, string> = {
    town: "border-l-emerald-400/80",
    mafia: "border-l-red-500/70",
    neutral: "border-l-gray-400/60",
};

const FACTION_ORDER = ["town", "mafia", "neutral"] as const;

export function RoleSelectionOptions({ roles, selectedRoleCounts, allowDuplicateRoleIds, respectCardCount, disabled, onAdd }: RoleSelectionOptionsProps) {
    return (
        <div className="grid gap-6">
            {FACTION_ORDER.map((faction) => {
                // Roles novas ficam no fim de cada facção.
                const factionRoles = roles
                    .filter((role) => role.faction === faction)
                    .sort((left, right) => Number(NEW_ROLE_IDS.has(left.id)) - Number(NEW_ROLE_IDS.has(right.id)));
                if (factionRoles.length === 0) return null;

                return (
                    <section key={faction} aria-label={FACTION_LABELS[faction]}>
                        <h5 className="mb-2 flex items-baseline gap-2 font-serif text-lg font-semibold text-[#fffaf0]">
                            {FACTION_LABELS[faction]}
                            <span className="font-sans text-xs font-normal text-[#a9a297]">{factionRoles.length} roles</span>
                        </h5>
                        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {factionRoles.map((role) => {
                                const selectedCount = selectedRoleCounts[role.id] ?? 0;
                                const unavailable = (!allowDuplicateRoleIds && selectedCount > 0) || (respectCardCount && selectedCount >= role.cardCount);
                                const cardsLeft = role.cardCount - selectedCount;

                                return (
                                    <li key={role.id}>
                                        <button
                                            type="button"
                                            onClick={() => onAdd(role.id)}
                                            disabled={disabled || unavailable}
                                            style={{ borderLeftColor: NEUTRAL_ROLE_COLORS[role.id] }}
                                            className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-l-4 border-white/10 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-40 ${FACTION_STRIPES[faction]}`}
                                        >
                                            <span className="min-w-0">
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <span className="truncate font-semibold text-[#f8f1e5]" style={{ color: roleNameColor(role.id, role.faction) }}>{role.name}</span>
                                                    {NEW_ROLE_IDS.has(role.id) && (
                                                        <span className="shrink-0 rounded border border-[#c9a46a]/50 bg-[#c9a46a]/15 px-1.5 text-[10px] font-bold uppercase tracking-wide text-[#e6c992]">Nova</span>
                                                    )}
                                                </span>
                                                <span className="block text-xs text-[#a9a297]">
                                                    {`${selectedCount} ${selectedCount === 1 ? "selecionada" : "selecionadas"}`}
                                                    {respectCardCount && ` · ${cardsLeft > 0 ? `${cardsLeft} ${cardsLeft === 1 ? "carta" : "cartas"}` : "sem cartas"}`}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-sm font-semibold text-[#bdb7ad] tabular-nums" title="Virtue Value">
                                                {role.virtueValue > 0 ? "+" : ""}
                                                {role.virtueValue}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}
