"use client";

import { Ban, Check, Hash, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useBodyScrollLock } from "@/lib/utils/use-body-scroll-lock";
import type { RoleDefinition } from "@/types";

import { RequiredRolePicker, type RoleRule } from "./required-role-picker";
import {
  MAX_SUPPORTED_PLAYER_COUNT,
  MIN_SUPPORTED_PLAYER_COUNT,
} from "./suggested-faction-counts";

interface SemiAutomaticCompositionDialogProps {
  initialPlayerCount: number;
  roles: readonly RoleDefinition[];
  respectCardCount: boolean;
  onRespectCardCountChange: (value: boolean) => void;
  onCancel: () => void;
  onConfirm: (
    playerCount: number,
    requiredRoleIds: readonly string[],
    excludedRoleIds: readonly string[],
    exactRoleCounts: Readonly<Record<string, number>>,
  ) => void;
}

const STORAGE_KEY = "semi-automatic-composition";

function readSavedSettings(): { playerCount: number; rules: Record<string, RoleRule> } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!saved || typeof saved.playerCount !== "number" || typeof saved.rules !== "object") return null;
    const playerCount = Math.min(MAX_SUPPORTED_PLAYER_COUNT, Math.max(MIN_SUPPORTED_PLAYER_COUNT, saved.playerCount));
    return { playerCount, rules: saved.rules };
  } catch {
    return null;
  }
}

const countButton =
  "grid size-11 place-items-center rounded-full border border-white/10 text-[#d8d2c8] transition hover:border-white/25 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a46a]/50 disabled:cursor-not-allowed disabled:opacity-30";

export function SemiAutomaticCompositionDialog({
  initialPlayerCount,
  roles,
  respectCardCount,
  onRespectCardCountChange,
  onCancel,
  onConfirm,
}: SemiAutomaticCompositionDialogProps) {
  useBodyScrollLock();
  const [saved] = useState(readSavedSettings);
  const [playerCount, setPlayerCount] = useState(saved?.playerCount ?? initialPlayerCount);
  const [rules, setRules] = useState<Record<string, RoleRule>>(saved?.rules ?? {});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ playerCount, rules }));
    } catch {
      // Sem armazenamento (aba privada): o modal só não lembra da última configuração.
    }
  }, [playerCount, rules]);
  const { requiredRoleIds, excludedRoleIds, exactRoleCounts } = useMemo(() => {
    // Saved rules may name roles that no longer exist.
    const entries = Object.entries(rules).filter(([id]) => roles.some((role) => role.id === id));
    return {
      requiredRoleIds: entries.flatMap(([id, rule]) =>
        rule.mode === "exclude" ? [] : Array<string>(rule.mode === "exact" ? rule.count : 1).fill(id),
      ),
      excludedRoleIds: entries.filter(([, rule]) => rule.mode === "exclude").map(([id]) => id),
      exactRoleCounts: Object.fromEntries(entries.flatMap(([id, rule]) => (rule.mode === "exact" ? [[id, rule.count]] : []))),
    };
  }, [roles, rules]);
  const valid = requiredRoleIds.length <= playerCount;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const changePlayerCount = (next: number) =>
    setPlayerCount(Math.min(MAX_SUPPORTED_PLAYER_COUNT, Math.max(MIN_SUPPORTED_PLAYER_COUNT, next)));

  const changeRule = (roleId: string, rule: RoleRule | null) =>
    setRules((current) => {
      const next = { ...current };
      if (rule) next[roleId] = rule;
      else delete next[roleId];
      return next;
    });

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="semi-automatic-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#171719] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/7 px-6 pb-4 pt-5">
          <div>
            <h2 id="semi-automatic-title" className="font-serif text-2xl font-semibold text-[#fffaf0]">
              Composição semiautomática
            </h2>
            <p className="mt-1 text-sm text-[#8f897f]">
              Diga o que precisa entrar e o que não pode. O resto é sorteado com Virtue entre −1 e +1.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-xl text-[#8f897f] transition hover:bg-white/5 hover:text-[#fffaf0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a46a]/50"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div className="flex items-center gap-4" role="group" aria-label="Número de jogadores">
              <button
                type="button"
                aria-label="Menos um jogador"
                disabled={playerCount <= MIN_SUPPORTED_PLAYER_COUNT}
                onClick={() => changePlayerCount(playerCount - 1)}
                className={countButton}
              >
                <Minus aria-hidden="true" className="size-4" />
              </button>
              <p className="min-w-24 text-center">
                <span aria-live="polite" className="block font-serif text-5xl leading-none font-semibold text-[#f4dfbd] tabular-nums">
                  {playerCount}
                </span>
                <span className="mt-1 block text-xs text-[#8f897f]">jogadores</span>
              </p>
              <button
                type="button"
                aria-label="Mais um jogador"
                disabled={playerCount >= MAX_SUPPORTED_PLAYER_COUNT}
                onClick={() => changePlayerCount(playerCount + 1)}
                className={countButton}
              >
                <Plus aria-hidden="true" className="size-4" />
              </button>
            </div>

            <label className="flex max-w-sm flex-1 cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/7 px-4 py-3 transition hover:bg-white/2">
              <span>
                <span className="block text-sm font-semibold text-[#fffaf0]">Respeitar as cartas do baralho</span>
                <span className="mt-0.5 block text-xs leading-5 text-[#8f897f]">Igual nas configurações da sala.</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={respectCardCount}
                onChange={(event) => onRespectCardCountChange(event.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-6 w-10 shrink-0 rounded-full bg-white/10 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-[#d8d2c8] after:transition-transform peer-checked:bg-[#7d2330] peer-checked:after:translate-x-4 peer-checked:after:bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#c9a46a]/50"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/7 pt-5">
            <p className="text-sm text-[#bdb7ad]">
              <Check aria-hidden="true" className="inline size-3.5 text-emerald-300" /> garante pelo menos uma,{" "}
              <Hash aria-hidden="true" className="inline size-3.5 text-[#e6cfa9]" /> fixa a quantidade exata,{" "}
              <Ban aria-hidden="true" className="inline size-3.5 text-[#f0b9bd]" /> deixa de fora.
            </p>
            <p className="text-xs text-[#8f897f] tabular-nums">
              <span className="font-semibold text-[#e6cfa9]">{requiredRoleIds.length}</span> de {playerCount} vagas fixas
              {excludedRoleIds.length > 0 && (
                <>
                  , <span className="font-semibold text-[#f0b9bd]">{excludedRoleIds.length}</span> fora
                </>
              )}
            </p>
          </div>

          <div className="mt-4">
            <RequiredRolePicker
              roles={roles}
              rules={rules}
              selectedCount={requiredRoleIds.length}
              playerCount={playerCount}
              respectCardCount={respectCardCount}
              onChange={changeRule}
            />
          </div>

          {!valid && (
            <p role="alert" className="mt-4 text-xs text-[#f0b9bd]">
              Há mais roles obrigatórias que jogadores. Tire algumas ou aumente a mesa.
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-white/7 bg-[#131315] px-6 py-4">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-lg px-4 text-sm font-semibold text-[#d8d2c8] transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a46a]/50">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onConfirm(playerCount, requiredRoleIds, excludedRoleIds, exactRoleCounts)}
            className="min-h-11 rounded-lg bg-[#7d2330] px-5 text-sm font-bold text-white transition hover:bg-[#93293a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a46a]/60 disabled:opacity-50"
          >
            Gerar composição
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
