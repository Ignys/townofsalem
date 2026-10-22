"use client";

import { Eraser, Shuffle } from "lucide-react";
import type { ReactNode } from "react";

import { useMemo, useState } from "react";

import { getAvailableRoles, NEW_ROLE_IDS, ROLE_DEFINITIONS } from "@/data/roles";
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

const MOBILE_PICKER_TABS = [
    { id: "random", label: "Aleatórias", dot: "bg-[#d3b88c]" },
    { id: "town", label: "Cidade", dot: "bg-emerald-400" },
    { id: "mafia", label: "Máfia", dot: "bg-red-500" },
    { id: "neutral", label: "Neutros", dot: "bg-gray-400" },
] as const;

type MobilePickerTab = (typeof MOBILE_PICKER_TABS)[number]["id"];

interface HostRoleCompositionProps {
    gameId: string;
    playerCount: number;
    editable: boolean;
    /** Escolha do modo de jogo, na coluna lateral abaixo do resumo. */
    playModeSelector?: ReactNode;
    /** "mobile": uma facção por vez e o sorteio preso acima do footer. */
    layout?: "desktop" | "mobile";
}

export function HostRoleComposition({ gameId, playerCount, editable, playModeSelector, layout = "desktop" }: HostRoleCompositionProps) {
    const composition = useRoleComposition(gameId);
    const roleDraw = useRoleDraw();
    const [order, setOrder] = useState<RoleCompositionOrder>("natural");
    const [pickerTab, setPickerTab] = useState<MobilePickerTab>("town");
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
    const disableNewRoles = gameVariants.variants.disableNewRoles;
    const availableRoles = getAvailableRoles(disableNewRoles);
    const randomOptions = {
        excludedRoleIds: [...gameVariants.randomRoleExclusions, ...(disableNewRoles ? NEW_ROLE_IDS : [])],
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

    const drawReady = composition.loaded && !composition.error && validation.valid;
    const drawDisabled = !editable || !composition.loaded || composition.saving || roleDraw.drawing || !validation.valid;
    const drawFeedback = (composition.saving || roleDraw.feedback) && (
        <p
            role={roleDraw.feedback?.kind === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`text-sm ${roleDraw.feedback?.kind === "error" ? "text-[#f0b9bd]" : roleDraw.feedback?.kind === "success" ? "text-[#bfe0c5]" : "text-[#bdb7ad]"}`}
        >
            {composition.saving ? "Salvando composição…" : roleDraw.feedback?.message}
        </p>
    );
    const selectedRoles = (
        <div>
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
    );
    const randomSlots = (
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
    );
    const compositionTools = (
        <CompositionTools roles={availableRoles} playerCount={playerCount} roleIds={composition.roleIds} disabled={controlsDisabled} respectCardCount={respectCardCount} onRespectCardCountChange={(value) => void gameVariants.updateVariants({ ...gameVariants.variants, compositionRespectsCardCount: value })} onApply={(roleIds) => void persistRoleIds(roleIds)} />
    );

    if (editable && layout === "mobile") {
        const firstError = composition.error ? "Não foi possível salvar a composição." : !composition.loaded ? "Carregando composição…" : validation.errors[0]?.message;
        return (
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 pb-36">
                {selectedRoles}

                <section aria-label="Selecionar roles" className="min-w-0">
                    {/* Uma facção por vez: a lista inteira passava de três telas de altura. */}
                    <div role="tablist" aria-label="Facção" className="sticky top-16 z-20 -mx-3 mb-3 flex gap-1 overflow-x-auto border-b border-white/10 bg-[#111315]/95 px-3 py-2 backdrop-blur">
                        {MOBILE_PICKER_TABS.map((tab) => {
                            const active = tab.id === pickerTab;
                            const count = tab.id === "random" ? composition.roleIds.filter((id) => getRandomRoleSlot(id)).length : composition.roleIds.filter((id) => ROLE_DEFINITIONS.find((role) => role.id === id)?.faction === tab.id).length;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setPickerTab(tab.id)}
                                    className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-[#d3b88c] ${active ? "bg-[#d3b88c] text-[#1b1d20]" : "text-[#bdb7ad] hover:text-[#fffaf0]"}`}
                                >
                                    <span aria-hidden="true" className={`size-2 rounded-full ${tab.dot}`} />
                                    {tab.label}
                                    {count > 0 && <span className={`tabular-nums ${active ? "text-[#1b1d20]/70" : "text-[#8d877e]"}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div role="tabpanel">
                        {pickerTab === "random" ? (
                            randomSlots
                        ) : (
                            <RoleSelectionOptions
                                roles={availableRoles}
                                selectedRoleCounts={selectedRoleCounts}
                                allowDuplicateRoleIds={ROLE_COMPOSITION_RULES.allowDuplicateRoleIds}
                                respectCardCount={respectCardCount}
                                disabled={controlsDisabled}
                                onAdd={handleAdd}
                                factions={[pickerTab]}
                            />
                        )}
                    </div>
                </section>

                <details className="panel-private group">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-serif text-lg font-semibold text-[#fffaf0]">
                        Composições salvas e cartas
                        <span aria-hidden="true" className="text-[#a9a297] transition-transform group-open:rotate-180">⌄</span>
                    </summary>
                    <div className="mt-3 grid gap-5 border-t border-white/10 pt-4">
                        <RoleCompositionSummary roleCount={composition.roleIds.length} playerCount={playerCount} virtue={virtue} />
                        {compositionTools}
                    </div>
                </details>

                {/* Fica logo acima do footer: contagem, motivo do bloqueio e o sorteio sempre à mão. */}
                <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 px-3 pb-2">
                    <div className={`flex items-center gap-3 rounded-2xl border bg-[#16181b]/97 p-2 pl-4 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur ${drawReady ? "border-[#6f9b77]/50" : "border-[#a33843]/45"}`}>
                        <div className="min-w-0 flex-1">
                            <p className="flex items-baseline gap-1.5 text-[#fffaf0]">
                                <span className={`font-serif text-2xl font-semibold tabular-nums ${composition.roleIds.length === playerCount ? "text-[#bfe0c5]" : "text-[#f0b9bd]"}`}>
                                    {composition.roleIds.length}/{playerCount}
                                </span>
                                <span className="text-xs text-[#a9a297]">roles</span>
                            </p>
                            <p role={drawReady ? "status" : "alert"} className={`truncate text-xs ${drawReady ? "text-[#bfe0c5]" : "text-[#f0b9bd]"}`}>
                                {drawReady ? "Pronto para sortear" : firstError}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => void roleDraw.start(gameId, validation)}
                            disabled={drawDisabled}
                            className="flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-[#7d2330] px-4 text-sm font-bold text-white transition-colors hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-[#77726b]"
                        >
                            <Shuffle aria-hidden="true" className="size-4" />
                            {roleDraw.drawing ? "Sorteando…" : "Sortear"}
                        </button>
                    </div>
                    {drawFeedback && <div className="mt-1 rounded-lg bg-[#16181b]/95 px-3 py-1">{drawFeedback}</div>}
                </div>
            </div>
        );
    }

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
                    {selectedRoles}

                    <div className="mt-6 border-t border-white/10 pt-6">
                        <h4 className="mb-3 text-sm font-semibold text-[#d8d2c8]">Selecionar roles</h4>
                        {/* Mesmo formato das facções: a faixa tracejada diz que a role só sai no sorteio. */}
                        <section aria-label="Aleatórias" className="mb-6">
                            <h5 className="mb-2 flex items-baseline gap-2 font-serif text-lg font-semibold text-[#fffaf0]">
                                Aleatórias
                                <span className="font-sans text-xs font-normal text-[#a9a297]">sorteadas no início</span>
                            </h5>
                            {randomSlots}
                        </section>
                        <RoleSelectionOptions
                            roles={availableRoles}
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
                    <CompositionTools roles={availableRoles} playerCount={playerCount} roleIds={composition.roleIds} disabled={controlsDisabled} respectCardCount={respectCardCount} onRespectCardCountChange={(value) => void gameVariants.updateVariants({ ...gameVariants.variants, compositionRespectsCardCount: value })} onApply={(roleIds) => void persistRoleIds(roleIds)} />
                    </div>
                </section>
            </div>
    );
}
