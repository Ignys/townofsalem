"use client";

import { Dices, Eraser, Shuffle, TriangleAlert, X } from "lucide-react";
import { useRef, useState } from "react";

import { getRoleById, NEW_ROLE_IDS } from "@/data/roles";

import { CompositionTools } from "./composition-tools";
import { getRandomRoleSlot, RANDOM_ROLE_SLOTS } from "./random-role-slots";
import { roleNameColor } from "./role-colors";
import { orderSelectedRoles } from "./role-composition-order";
import { ROLE_COMPOSITION_RULES } from "./role-composition-rules";
import { useRoleCompositionState } from "./use-role-composition-state";
import { useRoleDraw } from "./use-role-draw";

// ponytail: cada peça abre sua própria leitura da composição; o SDK do Firebase divide o mesmo listener.

const PICKER_TABS = [
    { id: "town", label: "Cidade", color: "#3dd69b" },
    { id: "mafia", label: "Máfia", color: "#db4242" },
    { id: "neutral", label: "Neutros", color: "#a8a8a8" },
    { id: "random", label: "Aleatórias", color: "#d3b88c" },
] as const;

type PickerTab = (typeof PICKER_TABS)[number]["id"];

/** Cor de uma role ou de um sorteio; "Aleatório" pode sair de qualquer lado, então é dourado. */
function roleColor(roleId: string) {
    const slot = getRandomRoleSlot(roleId);
    if (slot) return PICKER_TABS.find((tab) => tab.id === slot.faction)?.color ?? "#d3b88c";
    return roleNameColor(roleId, getRoleById(roleId)?.faction) ?? "#a8a8a8";
}

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

interface MobileRoleCompositionProps {
    gameId: string;
    playerCount: number;
}

/** Header da aba Roles: as duas contas que decidem se dá para sortear. */
export function MobileRoleStats({ gameId, playerCount }: MobileRoleCompositionProps) {
    const { composition, virtue } = useRoleCompositionState(gameId, playerCount);
    const roleCount = composition.roleIds.length;
    const countOk = roleCount === playerCount;
    const expected = Math.round(virtue.expected * 10) / 10;
    const balance = Math.abs(Math.round(virtue.expected));
    const virtueTone = balance === 0 ? "text-[#bfe0c5] bg-[#6f9b77]/15" : balance === 1 ? "text-[#e6cfa9] bg-amber-500/15" : "text-[#f0b9bd] bg-red-500/15";

    return (
        <dl className="flex shrink-0 items-stretch gap-1.5">
            <div className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 ${countOk ? "bg-[#6f9b77]/15 text-[#bfe0c5]" : "bg-red-500/15 text-[#f0b9bd]"}`}>
                <dt className="text-[10px] leading-3 opacity-75">roles</dt>
                <dd className="font-serif text-base font-semibold leading-5 tabular-nums" aria-label={`${roleCount} roles para ${playerCount} jogadores`}>
                    {roleCount}/{playerCount}
                </dd>
            </div>
            <div className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 ${virtueTone}`}>
                <dt className="text-[10px] leading-3 opacity-75">virtue</dt>
                <dd className="font-serif text-base font-semibold leading-5 tabular-nums" aria-label={`Virtue Value ${signed(expected)}`}>
                    {virtue.min !== virtue.max && "≈"}
                    {signed(expected)}
                </dd>
            </div>
        </dl>
    );
}

/** Pílula central acima das abas: começa a partida de qualquer aba do lobby. */
export function MobileDrawButton({ gameId, playerCount }: MobileRoleCompositionProps) {
    const { composition, validation } = useRoleCompositionState(gameId, playerCount);
    const roleDraw = useRoleDraw();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const problems = [
        ...(composition.error ? ["Não foi possível salvar a composição. Tente de novo."] : []),
        ...(roleDraw.feedback?.kind === "error" ? [roleDraw.feedback.message] : []),
        ...validation.errors.map((error) => error.message),
    ];
    const blocked = !composition.loaded || composition.saving || roleDraw.drawing;

    // Com pendência, o toque explica o motivo em vez de não fazer nada.
    const handleClick = () => {
        if (problems.length > 0) dialogRef.current?.showModal();
        else void roleDraw.start(gameId, validation);
    };

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                disabled={blocked}
                aria-describedby={problems.length > 0 ? "draw-blocked-hint" : undefined}
                className={`relative flex min-h-12 items-center gap-2 rounded-full border px-6 text-sm font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-wait disabled:opacity-70 ${
                    problems.length > 0
                        ? "border-white/10 bg-[#24262a] text-[#bdb7ad] shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                        : "border-[#d3b88c]/40 bg-[#7d2330] text-white shadow-[0_10px_30px_rgba(125,35,48,0.45)] hover:bg-[#681c27]"
                }`}
            >
                <Shuffle aria-hidden="true" className="size-4" />
                {roleDraw.drawing ? "Sorteando…" : "Sortear e começar"}
                {problems.length > 0 && (
                    <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full border-2 border-[#111315] bg-[#e0a43a] text-[#1b1d20]">
                        <TriangleAlert className="size-3.5" strokeWidth={2.5} />
                    </span>
                )}
            </button>
            {problems.length > 0 && (
                <span id="draw-blocked-hint" className="sr-only">
                    Ainda não dá para sortear. Toque para ver o motivo.
                </span>
            )}

            <dialog
                ref={dialogRef}
                aria-labelledby="draw-blocked-title"
                onClick={(event) => {
                    if (event.target === event.currentTarget) dialogRef.current?.close();
                }}
                className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-3xl border border-[#2e3136] bg-[#1b1d20] p-5 text-[#e5ded2] shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop:bg-black/70"
            >
                <h2 id="draw-blocked-title" className="flex items-center gap-2 font-serif text-xl font-semibold text-[#fffaf0]">
                    <TriangleAlert aria-hidden="true" className="size-5 text-[#e0a43a]" />
                    Antes de sortear
                </h2>
                <ul className="mt-4 grid gap-2">
                    {problems.map((problem) => (
                        <li key={problem} className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm leading-5">
                            {problem}
                        </li>
                    ))}
                </ul>
                <button type="button" onClick={() => dialogRef.current?.close()} className="btn-quiet-dark mt-5 w-full">
                    Entendi
                </button>
            </dialog>
        </>
    );
}

/** Aba Roles do celular: a mão escolhida em cima, o baralho de uma facção por vez embaixo. */
export function MobileRolePicker({ gameId, playerCount }: MobileRoleCompositionProps) {
    const state = useRoleCompositionState(gameId, playerCount);
    const { composition, selectedRoleCounts, respectCardCount, availableRoles, slotVirtues } = state;
    const [tab, setTab] = useState<PickerTab>("town");
    const disabled = !composition.loaded || composition.saving;
    const selected = orderSelectedRoles(composition.roleIds, "natural");

    const cards =
        tab === "random"
            ? RANDOM_ROLE_SLOTS.map((slot) => ({
                  id: slot.id,
                  name: slot.name,
                  virtue: slotVirtues[slot.id],
                  approx: true,
                  isNew: false,
                  unavailable: false,
                  note: slot.faction ? "Sorteada da facção" : "Qualquer role",
              }))
            : availableRoles
                  .filter((role) => role.faction === tab)
                  .sort((left, right) => Number(NEW_ROLE_IDS.has(left.id)) - Number(NEW_ROLE_IDS.has(right.id)))
                  .map((role) => {
                      const count = selectedRoleCounts[role.id] ?? 0;
                      const cardsLeft = role.cardCount - count;
                      return {
                          id: role.id,
                          name: role.name,
                          virtue: role.virtueValue,
                          approx: false,
                          isNew: NEW_ROLE_IDS.has(role.id),
                          unavailable: (!ROLE_COMPOSITION_RULES.allowDuplicateRoleIds && count > 0) || (respectCardCount && cardsLeft <= 0),
                          note: respectCardCount ? (cardsLeft > 0 ? `${cardsLeft} ${cardsLeft === 1 ? "carta" : "cartas"}` : "Sem cartas") : null,
                      };
                  });

    return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 pb-24">
            <section aria-labelledby="mobile-hand-title">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                    <h2 id="mobile-hand-title" className="font-serif text-lg font-semibold text-[#fffaf0]">
                        Na mesa
                    </h2>
                    <button
                        type="button"
                        onClick={() => void state.setRoleIds([])}
                        disabled={disabled || composition.roleIds.length === 0}
                        className="flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#bdb7ad] transition-colors hover:bg-[#a33843]/10 hover:text-[#f0b9bd] focus-visible:outline-3 focus-visible:outline-[#d3b88c] disabled:opacity-35"
                    >
                        <Eraser aria-hidden="true" className="size-3.5" />
                        Limpar
                    </button>
                </div>
                {selected.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/12 px-4 py-4 text-center text-sm text-[#9f9990]">Toque nas roles abaixo para colocar na mesa.</p>
                ) : (
                    <ol className="flex flex-wrap gap-1.5">
                        {selected.map(({ roleId, originalIndex }) => {
                            const name = getRoleById(roleId)?.name ?? getRandomRoleSlot(roleId)?.name ?? roleId;
                            const color = roleColor(roleId);
                            const value = getRoleById(roleId)?.virtueValue ?? slotVirtues[roleId] ?? null;
                            return (
                                <li
                                    key={`${roleId}-${originalIndex}`}
                                    className={`flex h-9 items-center gap-1.5 rounded-full border bg-white/[0.04] pr-0.5 pl-3 ${getRandomRoleSlot(roleId) ? "border-dashed border-white/20" : "border-white/12"}`}
                                >
                                    <span className="text-sm font-semibold" style={{ color }}>
                                        {name}
                                    </span>
                                    {value !== null && <span className="text-xs text-[#8d877e] tabular-nums">{signed(value)}</span>}
                                    <button
                                        type="button"
                                        onClick={() => state.remove(originalIndex)}
                                        disabled={disabled}
                                        aria-label={`Remover ${name}`}
                                        className="grid size-8 place-items-center rounded-full text-[#8d877e] transition-colors hover:bg-red-500/15 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-[#d3b88c] disabled:opacity-40"
                                    >
                                        <X aria-hidden="true" className="size-3.5" />
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </section>

            <section aria-label="Escolher roles" className="min-w-0">
                {/* Uma facção por vez: o baralho inteiro passava de três telas. */}
                <div role="tablist" aria-label="Facção" className="sticky top-16 z-20 -mx-3 mb-3 grid grid-cols-4 border-b border-white/10 bg-[#111315]/95 px-1 backdrop-blur">
                    {PICKER_TABS.map((option) => {
                        const active = option.id === tab;
                        const count =
                            option.id === "random"
                                ? composition.roleIds.filter((id) => getRandomRoleSlot(id)).length
                                : composition.roleIds.filter((id) => getRoleById(id)?.faction === option.id).length;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTab(option.id)}
                                className={`relative flex min-h-12 flex-col items-center justify-center text-[13px] font-semibold transition-colors focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-[#d3b88c] ${active ? "text-[#fffaf0]" : "text-[#8d877e]"}`}
                            >
                                <span className="flex items-center gap-1">
                                    {option.label}
                                    {count > 0 && (
                                        <span className="rounded-full px-1.5 text-[11px] leading-4 tabular-nums text-[#111315]" style={{ backgroundColor: option.color }}>
                                            {count}
                                        </span>
                                    )}
                                </span>
                                <span aria-hidden="true" className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-opacity ${active ? "opacity-100" : "opacity-0"}`} style={{ backgroundColor: option.color }} />
                            </button>
                        );
                    })}
                </div>

                <ul role="tabpanel" className="grid grid-cols-2 gap-2">
                    {cards.map((card) => {
                        const count = selectedRoleCounts[card.id] ?? 0;
                        const color = roleColor(card.id);
                        return (
                            <li key={card.id}>
                                <button
                                    type="button"
                                    onClick={() => state.add(card.id)}
                                    disabled={disabled || card.unavailable}
                                    aria-label={`Adicionar ${card.name}${count > 0 ? `, ${count} na mesa` : ""}`}
                                    className={`relative flex min-h-[4.75rem] w-full flex-col justify-between gap-2 overflow-hidden rounded-xl border px-3 pt-3.5 pb-2.5 text-left transition-colors active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:active:scale-100 ${
                                        count > 0 ? "border-[#d3b88c]/45 bg-[#d3b88c]/[0.07]" : "border-white/10 bg-[#1b1d20]"
                                    } ${tab === "random" ? "border-dashed" : ""}`}
                                >
                                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />
                                    <span className="flex items-start justify-between gap-2">
                                        <span className="min-w-0 text-[15px] font-semibold leading-tight" style={{ color }}>
                                            {tab === "random" && <Dices aria-hidden="true" className="mr-1 inline size-3.5 align-[-2px]" />}
                                            {card.name}
                                        </span>
                                        {count > 0 && <span className="shrink-0 rounded-full bg-[#d3b88c] px-1.5 text-xs leading-5 font-bold text-[#1b1d20] tabular-nums">×{count}</span>}
                                    </span>
                                    <span className="flex items-center gap-2 text-xs text-[#8d877e]">
                                        {card.virtue !== null && (
                                            <span className="font-semibold text-[#bdb7ad] tabular-nums">
                                                {card.approx && "≈"}
                                                {signed(card.virtue)}
                                            </span>
                                        )}
                                        {card.note && <span className="truncate">{card.note}</span>}
                                        {card.isNew && <span className="ml-auto rounded border border-[#c9a46a]/50 bg-[#c9a46a]/15 px-1 text-[10px] font-bold text-[#e6c992]">Nova</span>}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <details className="panel-private group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-serif text-lg font-semibold text-[#fffaf0]">
                    Composições prontas
                    <span aria-hidden="true" className="text-sm text-[#a9a297] transition-transform group-open:rotate-180">
                        ▾
                    </span>
                </summary>
                <div className="mt-3 border-t border-white/10 pt-4">
                    <CompositionTools
                        roles={availableRoles}
                        playerCount={playerCount}
                        roleIds={composition.roleIds}
                        disabled={disabled}
                        respectCardCount={respectCardCount}
                        onRespectCardCountChange={(value) => void state.gameVariants.updateVariants({ ...state.gameVariants.variants, compositionRespectsCardCount: value })}
                        onApply={(roleIds) => void state.setRoleIds(roleIds)}
                    />
                </div>
            </details>
        </div>
    );
}
