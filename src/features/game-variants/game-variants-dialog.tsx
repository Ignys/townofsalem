"use client";

import { useEffect, useState, type ReactNode } from "react";

import { NEW_ROLE_IDS } from "@/data/roles";
import type { GameVariants } from "@/game-engine/variants";
import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";
import type { RoleDefinition } from "@/types";

import { BOOLEAN_GAME_VARIANT_OPTIONS } from "./game-variant-options";

interface GameVariantsDialogProps {
  initialVariants: GameVariants;
  initialAmnesiacRolePool: readonly string[];
  initialRandomRoleExclusions: readonly string[];
  roles: readonly RoleDefinition[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: (
    variants: GameVariants,
    amnesiacRolePool: readonly string[],
    randomRoleExclusions: readonly string[],
  ) => void;
}

const selectClass =
  "min-h-11 w-full rounded-lg border border-white/10 bg-[#0f1011] px-3 text-sm text-[#fffaf0] outline-none transition focus-visible:border-[#c9a46a] focus-visible:ring-2 focus-visible:ring-[#c9a46a]/30";

// Atalhos do celular: a lista de roles deixa o modal com várias telas de altura.
const SECTIONS = [
  { id: "variants-game", label: "Jogo" },
  { id: "variants-roles", label: "Roles" },
  { id: "variants-amnesiac", label: "Amnesiac" },
  { id: "variants-random", label: "Aleatórios" },
] as const;

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-14 border-t border-white/7 py-5 first:border-t-0 first:pt-1 sm:scroll-mt-0">
      <h3 className="font-serif text-lg font-semibold text-[#f4dfbd]">{title}</h3>
      {hint && <p className="mt-1 text-xs leading-5 text-[#8f897f]">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RoleChips({
  roles,
  selected,
  disabled,
  onToggle,
}: {
  roles: readonly RoleDefinition[];
  selected: readonly string[];
  disabled: boolean;
  onToggle: (roleId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <label
          key={role.id}
          className="flex min-h-9 cursor-pointer select-none items-center rounded-full border border-white/10 px-3 py-1.5 text-sm text-[#aaa49b] transition hover:border-white/25 hover:text-[#e5ded2] has-checked:border-[#7d2330] has-checked:bg-[#7d2330]/25 has-checked:text-[#fffaf0] has-focus-visible:ring-2 has-focus-visible:ring-[#c9a46a]/50"
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={selected.includes(role.id)}
            disabled={disabled}
            onChange={() => onToggle(role.id)}
          />
          {role.name}
        </label>
      ))}
    </div>
  );
}

function toggleIn(list: readonly string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id].sort();
}

export function GameVariantsDialog({
  initialVariants,
  initialAmnesiacRolePool,
  initialRandomRoleExclusions,
  roles,
  saving,
  onCancel,
  onConfirm,
}: GameVariantsDialogProps) {
  useBodyScrollLock();
  const [draft, setDraft] = useState(initialVariants);
  const [amnesiacRolePool, setAmnesiacRolePool] = useState(initialAmnesiacRolePool);
  const [randomRoleExclusions, setRandomRoleExclusions] = useState(initialRandomRoleExclusions);
  const availableRoles = draft.disableNewRoles ? roles.filter(({ id }) => !NEW_ROLE_IDS.has(id)) : roles;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saving, onCancel]);

  const renderSwitches = (group: "roles" | "game") => (
    <div className="divide-y divide-white/6 overflow-hidden rounded-xl border border-white/7">
      {BOOLEAN_GAME_VARIANT_OPTIONS.filter((option) => option.group === group).map((option) => (
        <label key={option.key} className="flex cursor-pointer items-start justify-between gap-4 px-4 py-3 transition hover:bg-white/2">
          <span>
            <span className="block text-sm font-semibold text-[#fffaf0]">{option.label}</span>
            <span className="mt-0.5 block text-xs leading-5 text-[#8f897f]">{option.description}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={draft[option.key]}
            disabled={saving}
            onChange={(event) => setDraft((current) => ({ ...current, [option.key]: event.target.checked }))}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full bg-white/10 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-[#d8d2c8] after:transition-transform peer-checked:bg-[#7d2330] peer-checked:after:translate-x-4 peer-checked:after:bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#c9a46a]/50"
          />
        </label>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm max-sm:items-end max-sm:p-0"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="variants-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#171719] shadow-2xl max-sm:max-h-[94svh] max-sm:rounded-b-none max-sm:rounded-t-[1.75rem] max-sm:border-b-0 max-sm:animate-[sheet-up_220ms_ease-out] motion-reduce:animate-none"
      >
        <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <header className="flex items-start justify-between gap-4 border-b border-white/7 px-6 pb-4 pt-5 max-sm:border-b-0 max-sm:px-5 max-sm:pt-3 max-sm:pb-2">
          <div>
            <h2 id="variants-title" className="font-serif text-2xl font-semibold text-[#fffaf0] max-sm:text-[1.375rem]">
              Configurações da partida
            </h2>
            <p className="mt-1 text-sm text-[#8f897f]">Valem só para esta partida.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Fechar"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-xl max-sm:size-11 max-sm:rounded-full max-sm:bg-white/5 text-[#8f897f] transition hover:bg-white/5 hover:text-[#fffaf0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a46a]/50"
          >
            ×
          </button>
        </header>

        <div className="relative flex-1 overflow-y-auto px-6 max-sm:px-5">
          <nav aria-label="Seções" className="sticky top-0 z-10 -mx-5 mb-2 flex gap-1.5 overflow-x-auto border-b border-white/7 bg-[#171719]/95 px-5 py-2.5 backdrop-blur sm:hidden">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex min-h-9 shrink-0 items-center rounded-full border border-white/10 px-3.5 text-sm font-semibold text-[#d8d2c8] transition-colors active:bg-white/8 focus-visible:outline-2 focus-visible:outline-[#c9a46a]"
              >
                {section.label}
              </a>
            ))}
          </nav>
          <Section id="variants-game" title="Jogo e painel" hint="Começam desativadas, exceto quando indicado.">
            <label className="mb-4 grid gap-1.5 text-sm text-[#e5ded2]">
              Sons de noite e julgamento
              <select value={draft.announcementSounds} disabled={saving} onChange={(event) => setDraft((current) => ({ ...current, announcementSounds: event.target.value as GameVariants["announcementSounds"] }))} className={selectClass}>
                <option value="both">Jogadores e host</option>
                <option value="players">Só nos celulares dos jogadores</option>
                <option value="host">Só no dispositivo do host</option>
              </select>
            </label>
            {renderSwitches("game")}
          </Section>

          <Section id="variants-roles" title="Variantes de roles" hint="Começam desativadas, exceto quando indicado.">
            <label className="mb-4 grid gap-1.5 text-sm text-[#e5ded2]">
              Sheriff investigando Werewolf
              <select value={draft.sheriffWerewolfDetection} disabled={saving} onChange={(event) => setDraft((current) => ({ ...current, sheriffWerewolfDetection: event.target.value as GameVariants["sheriffWerewolfDetection"] }))} className={selectClass}>
                <option value="normal">Normal — sempre Good</option>
                <option value="full-moon">Evil somente na lua cheia</option>
                <option value="always">Sempre Evil</option>
              </select>
            </label>
            {renderSwitches("roles")}
          </Section>
          <Section id="variants-amnesiac" title="Roles possíveis do Amnesiac" hint="Cartas que poderão ser sorteadas na Night 3.">
            <RoleChips
              roles={availableRoles.filter(({ id }) => id !== "amnesiac")}
              selected={amnesiacRolePool}
              disabled={saving}
              onToggle={(id) => setAmnesiacRolePool((current) => toggleIn(current, id))}
            />
          </Section>

          <Section id="variants-random" title="Fora dos slots aleatórios" hint="Nunca saem de um slot aleatório, mas ainda podem entrar como role fixa.">
            <RoleChips
              roles={availableRoles}
              selected={randomRoleExclusions}
              disabled={saving}
              onToggle={(id) => setRandomRoleExclusions((current) => toggleIn(current, id))}
            />
          </Section>
        </div>

        <footer className="flex justify-end gap-3 border-t border-white/7 bg-[#131315] px-6 py-4 max-sm:px-5 max-sm:pt-3 max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-sm:[&>button]:min-h-12">
          <button type="button" disabled={saving} onClick={onCancel} className="min-h-11 rounded-lg px-4 text-sm font-semibold text-[#d8d2c8] max-sm:flex-1 max-sm:rounded-xl max-sm:border max-sm:border-white/12 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a46a]/50">
            Cancelar
          </button>
          <button type="button" disabled={saving} onClick={() => onConfirm(
            draft,
            draft.disableNewRoles ? amnesiacRolePool.filter((id) => !NEW_ROLE_IDS.has(id)) : amnesiacRolePool,
            randomRoleExclusions,
          )} className="min-h-11 rounded-lg bg-[#7d2330] px-5 max-sm:flex-[2] max-sm:rounded-xl text-sm font-bold text-white transition hover:bg-[#93293a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a46a]/60 disabled:opacity-50">
            {saving ? "Salvando…" : "Salvar configurações"}
          </button>
        </footer>
      </section>
    </div>
  );
}
