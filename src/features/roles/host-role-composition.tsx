"use client";

import { useMemo, useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { useGameVariants } from "@/features/game-variants/use-game-variants";

import { CompositionTools } from "./composition-tools";
import { averageSlotVirtue, estimateVirtue, getRandomRoleSlot, RANDOM_ROLE_SLOTS } from "./random-role-slots";
import type { RoleCompositionOrder } from "./role-composition-order";
import { RoleCompositionOrderToggle } from "./role-composition-order-toggle";
import { ROLE_COMPOSITION_RULES } from "./role-composition-rules";
import { RoleCompositionSummary } from "./role-composition-summary";
import { RoleCompositionValidation } from "./role-composition-validation";
import { FACTION_STYLES, RoleSelectionOptions } from "./role-selection-options";
import { SelectedRoleComposition } from "./selected-role-composition";
import { useRoleComposition } from "./use-role-composition";
import { useRoleDraw } from "./use-role-draw";
import { validateRoleComposition } from "./validate-role-composition";

interface HostRoleCompositionProps {
    gameId: string;
    playerCount: number;
    editable: boolean;
}

export function HostRoleComposition({ gameId, playerCount, editable }: HostRoleCompositionProps) {
    const composition = useRoleComposition(gameId);
    const roleDraw = useRoleDraw();
    const [order, setOrder] = useState<RoleCompositionOrder>("natural");
    const selectedRoleCounts = useMemo(
        () =>
            composition.roleIds.reduce<Record<string, number>>((counts, roleId) => {
                counts[roleId] = (counts[roleId] ?? 0) + 1;
                return counts;
            }, {}),
        [composition.roleIds],
    );
    const gameVariants = useGameVariants(gameId);
    const respectCardCount = gameVariants.variants.compositionRespectsCardCount;
    const validation = validateRoleComposition({
        roleIds: composition.roleIds,
        playerCount,
        rules: { ...ROLE_COMPOSITION_RULES, enforceCardCounts: respectCardCount },
    });
    const randomOptions = {
        excludedRoleIds: gameVariants.randomRoleExclusions,
        respectCardCount: respectCardCount && gameVariants.variants.randomRolesRespectCardCount,
    };
    const virtue = estimateVirtue(composition.roleIds, randomOptions);
    const slotVirtues = Object.fromEntries(RANDOM_ROLE_SLOTS.map((slot) => {
        const average = averageSlotVirtue(slot.id, composition.roleIds, randomOptions);
        return [slot.id, average === null ? null : Math.round(average * 10) / 10];
    }));
    const controlsDisabled = !editable || !composition.loaded || composition.saving || roleDraw.drawing;

    const persistRoleIds = async (roleIds: readonly string[]) => {
        roleDraw.clearFeedback();
        await composition.updateRoleIds(roleIds);
    };

    const handleAdd = (roleId: string) => {
        if (respectCardCount && !getRandomRoleSlot(roleId) && (selectedRoleCounts[roleId] ?? 0) >= (ROLE_DEFINITIONS.find((role) => role.id === roleId)?.cardCount ?? 0)) {
            return;
        }

        void persistRoleIds([...composition.roleIds, roleId]);
    };

    const handleRemove = (index: number) => {
        void persistRoleIds(composition.roleIds.filter((_, roleIndex) => roleIndex !== index));
    };

    if (!editable) {
        return (
            <section className="w-full shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-7">
                <p className="text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">Configuração concluída</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-[#fffaf0]">Composição bloqueada</h2>
                <p role={roleDraw.feedback?.kind === "error" ? "alert" : "status"} className={`mt-3 text-sm leading-6 ${roleDraw.feedback?.kind === "error" ? "text-[#f0b9bd]" : "text-[#bfe0c5]"}`}>
                    {roleDraw.feedback?.message ?? "As roles foram atribuídas e não podem ser sorteadas novamente."}
                </p>
            </section>
        );
    }

    return (
            <div className="pr-4 p-1 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.7fr)]">
                <section className="min-w-0 pb-5">
                    <header>
                        <h3 className="mt-2 font-serif text-2xl font-semibold text-[#fffaf0]">Composição de roles</h3>
                    </header>

                    <div className="mt-2">
                        <section className="flex w-full justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-[#d8d2c8]">Roles selecionadas</h4>
                            <RoleCompositionOrderToggle order={order} onChange={setOrder} />
                        </section>
                        <SelectedRoleComposition roleIds={composition.roleIds} slotVirtues={slotVirtues} order={order} disabled={controlsDisabled} onRemove={handleRemove} />
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-6">
                        <h4 className="mb-4 text-sm font-semibold text-[#d8d2c8]">Selecionar roles</h4>
                        <ul className="mb-2 grid gap-2 sm:grid-cols-4">
                            {RANDOM_ROLE_SLOTS.map((slot) => (
                                <li key={slot.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleAdd(slot.id)}
                                        disabled={controlsDisabled}
                                        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-dashed px-2 py-2 font-semibold text-[#f8f1e5] transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-50 ${(FACTION_STYLES[slot.faction ?? "neutral"]).card}`}
                                    >
                                        <span>{slot.name}</span>
                                        {slotVirtues[slot.id] !== null && (
                                            <span className="text-xs text-white/50" title="Média das roles possíveis">
                                                ≈ {slotVirtues[slot.id]! > 0 ? "+" : ""}{slotVirtues[slot.id]}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <RoleSelectionOptions
                            roles={ROLE_DEFINITIONS}
                            selectedRoleCounts={selectedRoleCounts}
                            allowDuplicateRoleIds={ROLE_COMPOSITION_RULES.allowDuplicateRoleIds}
                            respectCardCount={respectCardCount}
                            disabled={controlsDisabled}
                            onAdd={handleAdd}
                        />
                    </div>
                </section>
                <section className="space-y-2">
                    <RoleCompositionSummary roleCount={composition.roleIds.length} playerCount={playerCount} virtue={virtue} />
                    <CompositionTools gameId={gameId} playerCount={playerCount} disabled={controlsDisabled} onApply={(roleIds) => void persistRoleIds(roleIds)} />
                    <div className=" border-white/10">
                        {!composition.loaded ? (
                            <p role="status" className="text-sm text-[#bdb7ad]">
                                Carregando composição…
                            </p>
                        ) : composition.error ? (
                            <p role="alert" className="rounded-xl border border-[#a33843]/35 bg-[#a33843]/10 px-4 py-3 text-sm text-[#f0b9bd]">
                                Não foi possível salvar ou acompanhar a composição. Tente novamente.
                            </p>
                        ) : (
                            <RoleCompositionValidation result={validation} />
                        )}

                        <button
                            type="button"
                            onClick={() => void roleDraw.start(gameId, validation)}
                            disabled={!editable || !composition.loaded || composition.saving || roleDraw.drawing || !validation.valid}
                            className="mt-2 min-h-12 w-full rounded-xl bg-[#7d2330] px-5 py-3 font-bold text-white transition-colors hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:bg-[#5d5552]"
                        >
                            {roleDraw.drawing ? "Sorteando roles…" : "Sortear roles & Iniciar partida"}
                        </button>

                        <p
                            role={roleDraw.feedback?.kind === "error" ? "alert" : "status"}
                            aria-live="polite"
                            className={`mt-3 min-h-5 text-sm ${roleDraw.feedback?.kind === "error" ? "text-[#f0b9bd]" : roleDraw.feedback?.kind === "success" ? "text-[#bfe0c5]" : "text-[#bdb7ad]"}`}
                        >
                            {composition.saving ? "Salvando composição…" : (roleDraw.feedback?.message ?? "")}
                        </p>
                    </div>
                </section>
            </div>
    );
}
