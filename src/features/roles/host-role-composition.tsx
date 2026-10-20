"use client";

import { Eraser, Shuffle } from "lucide-react";
import type { ReactNode } from "react";

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
import { RoleSelectionOptions } from "./role-selection-options";
import { SelectedRoleComposition } from "./selected-role-composition";
import { useRoleComposition } from "./use-role-composition";
import { useRoleDraw } from "./use-role-draw";
import { validateRoleComposition } from "./validate-role-composition";

// Faixa da facção do sorteio; "Aleatório" pode sair de qualquer lado, então fica dourada.
const RANDOM_SLOT_STRIPES: Record<string, string> = {
    town: "border-l-emerald-500/70",
    mafia: "border-l-red-500/70",
    neutral: "border-l-gray-400/60",
    any: "border-l-[#d3b88c]/70",
};

interface HostRoleCompositionProps {
    gameId: string;
    playerCount: number;
    editable: boolean;
    /** Escolha do modo de jogo, na coluna lateral abaixo do resumo. */
    playModeSelector?: ReactNode;
}

export function HostRoleComposition({ gameId, playerCount, editable, playModeSelector }: HostRoleCompositionProps) {
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
                                <h2 className="font-serif text-2xl font-semibold text-[#fffaf0]">Composição bloqueada</h2>
                <p role={roleDraw.feedback?.kind === "error" ? "alert" : "status"} className={`mt-3 text-sm leading-6 ${roleDraw.feedback?.kind === "error" ? "text-[#f0b9bd]" : "text-[#bfe0c5]"}`}>
                    {roleDraw.feedback?.message ?? "As roles foram atribuídas e não podem ser sorteadas novamente."}
                </p>
            </section>
        );
    }

    return (
            <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.7fr)]">
                <section className=" min-w-0">
                    <div className="">
                        <section className="mb-3 flex w-full items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-[#d8d2c8]">Roles selecionadas</h4>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => void persistRoleIds([])}
                                    disabled={controlsDisabled || composition.roleIds.length === 0}
                                    className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-[#d7d0c4] transition-colors hover:border-[#a33843]/50 hover:bg-[#a33843]/10 hover:text-[#f0b9bd] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Eraser aria-hidden="true" className="size-4" />
                                    Limpar
                                </button>
                                <RoleCompositionOrderToggle order={order} onChange={setOrder} />
                            </div>
                        </section>
                        <SelectedRoleComposition roleIds={composition.roleIds} slotVirtues={slotVirtues} order={order} disabled={controlsDisabled} onRemove={handleRemove} />
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-6">
                        <h4 className="mb-3 text-sm font-semibold text-[#d8d2c8]">Selecionar roles</h4>
                        {/* Mesmo formato das facções: a faixa tracejada diz que a role só sai no sorteio. */}
                        <section aria-label="Aleatórias" className="mb-6">
                            <h5 className="mb-2 flex items-baseline gap-2 font-serif text-lg font-semibold text-[#fffaf0]">
                                Aleatórias
                                <span className="font-sans text-xs font-normal text-[#a9a297]">sorteadas no início</span>
                            </h5>
                            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {RANDOM_ROLE_SLOTS.map((slot) => (
                                    <li key={slot.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleAdd(slot.id)}
                                            disabled={controlsDisabled}
                                            className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-l-4 border-dashed border-white/15 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-white/30 hover:bg-white/[0.07] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-40 ${RANDOM_SLOT_STRIPES[slot.faction ?? "any"]}`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold text-[#f8f1e5]">{slot.name}</span>
                                                <span className="block text-xs text-[#a9a297]">Qualquer role {slot.faction ? "da facção" : "do jogo"}</span>
                                            </span>
                                            {slotVirtues[slot.id] !== null && (
                                                <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-[#bdb7ad] tabular-nums" title="Média das roles possíveis">
                                                    ≈ {slotVirtues[slot.id]! > 0 ? "+" : ""}{slotVirtues[slot.id]}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
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
                <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
                    {/* Status e botão formam uma peça só: a mensagem diz se o botão abaixo já pode ser usado. */}
                    <div
                        className={`overflow-hidden rounded-2xl border ${
                            composition.loaded && !composition.error && validation.valid
                                ? "border-[#6f9b77]/40 bg-[#6f9b77]/10"
                                : "border-[#a33843]/40 bg-[#a33843]/10"
                        }`}
                    >
                        {!composition.loaded ? (
                            <p role="status" className="px-4 py-3.5 text-sm text-[#bdb7ad]">
                                Carregando composição…
                            </p>
                        ) : composition.error ? (
                            <p role="alert" className="px-4 py-3.5 text-sm text-[#f0b9bd]">
                                Não foi possível salvar ou acompanhar a composição. Tente novamente.
                            </p>
                        ) : (
                            <RoleCompositionValidation result={validation} />
                        )}
                        <button
                            type="button"
                            onClick={() => void roleDraw.start(gameId, validation)}
                            disabled={!editable || !composition.loaded || composition.saving || roleDraw.drawing || !validation.valid}
                            className="flex min-h-14 w-full items-center justify-center gap-2 bg-[#7d2330] px-4 text-base font-bold text-white transition-colors hover:bg-[#681c27] focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-[#77726b]"
                        >
                            <Shuffle aria-hidden="true" className="size-5" />
                            {roleDraw.drawing ? "Sorteando roles…" : "Sortear roles e começar"}
                        </button>
                    </div>
                    {(composition.saving || roleDraw.feedback) && (
                        <p
                            role={roleDraw.feedback?.kind === "error" ? "alert" : "status"}
                            aria-live="polite"
                            className={`-mt-1 text-sm ${roleDraw.feedback?.kind === "error" ? "text-[#f0b9bd]" : roleDraw.feedback?.kind === "success" ? "text-[#bfe0c5]" : "text-[#bdb7ad]"}`}
                        >
                            {composition.saving ? "Salvando composição…" : roleDraw.feedback?.message}
                        </p>
                    )}
                    <div className="panel-private grid grid-cols-[minmax(0,1fr)] divide-y divide-white/10 [&>*]:py-5 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
                    <RoleCompositionSummary roleCount={composition.roleIds.length} playerCount={playerCount} virtue={virtue} />
                    {playModeSelector}
                    <CompositionTools playerCount={playerCount} roleIds={composition.roleIds} disabled={controlsDisabled} respectCardCount={respectCardCount} onRespectCardCountChange={(value) => void gameVariants.updateVariants({ ...gameVariants.variants, compositionRespectsCardCount: value })} onApply={(roleIds) => void persistRoleIds(roleIds)} />
                    </div>
                </section>
            </div>
    );
}
