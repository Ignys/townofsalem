"use client";

import { Dices } from "lucide-react";

import { getRoleById } from "@/data/roles";

import { getRandomRoleSlot } from "./random-role-slots";
import { NEUTRAL_ROLE_COLORS } from "./role-colors";
import { orderSelectedRoles } from "./role-composition-order";
import { useRoleComposition } from "./use-role-composition";

// Tons escurecidos: as cores do painel escuro somem no pergaminho.
const PARCHMENT_FACTION_COLORS: Record<string, string> = {
    town: "#2f7d4f",
    mafia: "#9b2c2c",
    neutral: "#6b625a",
    any: "#8a6a2f",
};

/** Roles que o mestre está montando, ao vivo, para quem espera no lobby. */
export function LobbyCompositionPreview({ gameId, playerCount }: Readonly<{ gameId: string; playerCount: number }>) {
    const composition = useRoleComposition(gameId);
    if (!composition.loaded) return null;

    // Agrupa repetidas: "Mafioso ×2" lê melhor que duas fichas iguais.
    const grouped = new Map<string, number>();
    for (const { roleId } of orderSelectedRoles(composition.roleIds, "natural")) grouped.set(roleId, (grouped.get(roleId) ?? 0) + 1);

    return (
        <section aria-labelledby="lobby-composition-title" className="mt-4 border-b border-[#d8c8b0] pb-4">
            <div className="flex items-baseline justify-between gap-3">
                <h3 id="lobby-composition-title" className="text-sm font-semibold text-[#3b322e]">
                    Roles da partida
                </h3>
                <span className="text-xs text-[#75685f] tabular-nums">
                    {composition.roleIds.length} de {playerCount}
                </span>
            </div>
            {grouped.size === 0 ? (
                <p className="mt-2 text-sm text-[#75685f]">Nenhuma role escolhida ainda.</p>
            ) : (
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
                    {[...grouped].map(([roleId, count]) => {
                        const role = getRoleById(roleId);
                        const slot = getRandomRoleSlot(roleId);
                        const faction = role?.faction ?? slot?.faction ?? "any";
                        const color = (role && NEUTRAL_ROLE_COLORS[role.id] && "#5b524b") || PARCHMENT_FACTION_COLORS[faction];
                        return (
                            <li
                                key={roleId}
                                className={`flex h-7 items-center gap-1.5 rounded-full border bg-[#fffaf1] px-2.5 text-xs font-semibold ${slot ? "border-dashed border-[#b9a994]" : "border-[#d8c8b0]"}`}
                                style={{ color }}
                            >
                                {slot ? (
                                    <Dices aria-hidden="true" className="size-3.5" />
                                ) : (
                                    <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: NEUTRAL_ROLE_COLORS[roleId] ?? color }} />
                                )}
                                {role?.name ?? slot?.name ?? roleId}
                                {count > 1 && <span className="text-[#75685f] tabular-nums">×{count}</span>}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
