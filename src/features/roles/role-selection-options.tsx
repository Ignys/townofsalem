import type { RoleDefinition } from "@/types";

import { FACTION_LABELS } from "./role-presentation";

interface RoleSelectionOptionsProps {
    roles: readonly RoleDefinition[];
    selectedRoleCounts: Readonly<Record<string, number>>;
    allowDuplicateRoleIds: boolean;
    disabled: boolean;
    onAdd: (roleId: string) => void;
}

export const FACTION_STYLES: Record<string, { tag: string; card: string }> = {
    town: {
        tag: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
        card: "border-emerald-500/25 bg-emerald-950/15 hover:border-emerald-400/50 hover:bg-emerald-500/8",
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

const DEFAULT_STYLE = FACTION_STYLES.neutral;

export function RoleSelectionOptions({ roles, selectedRoleCounts, allowDuplicateRoleIds, disabled, onAdd }: RoleSelectionOptionsProps) {
    return (
        <ul className="grid gap-2 sm:grid-cols-3">
            {roles.map((role) => {
                const selectedCount = selectedRoleCounts[role.id] ?? 0;
                const unavailable = (!allowDuplicateRoleIds && selectedCount > 0) || selectedCount >= role.cardCount;
                const style = FACTION_STYLES[role.faction] ?? DEFAULT_STYLE;

                return (
                    <li key={role.id}>
                        <button
                            type="button"
                            onClick={() => onAdd(role.id)}
                            disabled={disabled || unavailable}
                            className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-2 pr-3 py-2 text-left font-semibold text-[#f8f1e5] transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-50 ${style.card}`}
                        >
                            <span className="flex items-center gap-2">
                                <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${style.tag}`}>{FACTION_LABELS[role.faction]}</span>
                                <span>
                                    {role.name}
                                    <span className="ml-2 text-xs font-normal text-[#9f9990]">
                                        {role.cardCount - selectedCount > 0 && (
                                            <span className="">
                                                {role.cardCount - selectedCount} {role.cardCount === 1 ? "carta" : "cartas"}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            </span>
                            <span className="text-xs text-white/50">
                                {role.virtueValue > 0 ? "+" : ""}
                                {role.virtueValue}
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
