"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import { getRoleById } from "@/data/roles";

import { getRandomRoleSlot } from "./random-role-slots";
import { FACTION_LABELS } from "./role-presentation";
import { orderSelectedRoles, type RoleCompositionOrder } from "./role-composition-order";
import { FACTION_STYLES } from "./role-selection-options";

interface SelectedRoleCompositionProps {
    roleIds: readonly string[];
    /** Pool average per random slot id; null when nothing can be rolled. */
    slotVirtues: Readonly<Record<string, number | null>>;
    order: RoleCompositionOrder;
    disabled: boolean;
    onRemove: (index: number) => void;
}

export function SelectedRoleComposition({ roleIds, slotVirtues, order, disabled, onRemove }: SelectedRoleCompositionProps) {
    const orderedRoles = useMemo(() => orderSelectedRoles(roleIds, order), [order, roleIds]);
    const virtueStyle = (virtueValue: number) => {
      if (virtueValue > 0) {
        return "text-emerald-950 bg-emerald-400/80 border border-transparent";
      } else if (virtueValue < 0) {
        return "text-red-950 bg-red-400/80 border border-transparent";
      } else {
        return "text-slate-950 bg-[#ffffff]/80 border border-transparent";
      }
    }


    return (
        <div>
            {orderedRoles.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-[#9f9990]">Nenhuma role selecionada.</p>
            ) : (
                <ol className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
                    {orderedRoles.map(({ roleId, originalIndex }) => {
                        const role = getRoleById(roleId);
                        const slot = getRandomRoleSlot(roleId);
                        const faction = role?.faction ?? slot?.faction ?? null;
                        const style = FACTION_STYLES[faction ?? "neutral"];
                        const roleName = role?.name ?? slot?.name ?? roleId;
                        const virtueValue = role?.virtueValue ?? slotVirtues[roleId] ?? null;

                        return (
                            <li key={`${roleId}-${originalIndex}`} className={`flex min-h-20 flex-col justify-between rounded-xl border p-3 transition ${style.card}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center h-full gap-1">
                                        {virtueValue !== null ? (
                                            <span
                                                aria-label={`Virtue Value ${slot ? "médio " : ""}${virtueValue}`}
                                                title={slot ? "Virtue Value médio das roles possíveis" : "Virtue Value"}
                                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-xs ${virtueStyle(virtueValue)}`}
                                            >
                                                {slot ? "≈" : ""}
                                                {virtueValue > 0 ? "+" : ""}
                                                {virtueValue}
                                            </span>
                                        ) : null}
                                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${style.tag}`}>
                                            {faction ? FACTION_LABELS[faction] : slot ? "Qualquer" : "Desconhecida"}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemove(originalIndex)}
                                        disabled={disabled}
                                        aria-label={`Remover ${roleName}`}
                                        title={`Remover ${roleName}`}
                                        className="grid size-full w-6 shrink-0 place-items-center rounded-lg text-[#bdb7ad] transition hover:bg-red-500/15 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <X aria-hidden="true" size={14} strokeWidth={1.8} />
                                    </button>
                                </div>

                                <div className="flex items-end justify-between gap-2">
                                    <span className="min-w-0 truncate font-semibold text-[#f8f1e5]">{roleName}</span>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
}
