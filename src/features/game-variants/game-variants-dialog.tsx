"use client";

import { useState } from "react";

import type { GameVariants } from "@/game-engine/variants";
import type { RoleDefinition } from "@/types";

import { BOOLEAN_GAME_VARIANT_OPTIONS } from "./game-variant-options";

interface GameVariantsDialogProps {
  initialVariants: GameVariants;
  initialAmnesiacRolePool: readonly string[];
  roles: readonly RoleDefinition[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: (variants: GameVariants, amnesiacRolePool: readonly string[]) => void;
}

export function GameVariantsDialog({
  initialVariants,
  initialAmnesiacRolePool,
  roles,
  saving,
  onCancel,
  onConfirm,
}: GameVariantsDialogProps) {
  const [draft, setDraft] = useState(initialVariants);
  const [amnesiacRolePool, setAmnesiacRolePool] = useState(
    initialAmnesiacRolePool,
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="variants-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#171719] p-5 shadow-2xl">
        <h2 id="variants-title" className="font-serif text-2xl font-semibold text-[#fffaf0]">Variantes da partida</h2>
        <p className="mt-2 text-sm text-[#aaa49b]">As regras opcionais começam desativadas, exceto quando indicado. Todas podem ser alteradas para esta partida.</p>

        <label className="mt-5 grid gap-2 text-sm text-[#f4dfbd]">
          Detecção do Werewolf pelo Sheriff
          <select value={draft.sheriffWerewolfDetection} onChange={(event) => setDraft((current) => ({ ...current, sheriffWerewolfDetection: event.target.value as GameVariants["sheriffWerewolfDetection"] }))} className="min-h-11 rounded-xl border border-white/15 bg-[#0f1011] px-3 text-[#fffaf0]">
            <option value="normal">Normal — sempre Good</option>
            <option value="full-moon">Evil somente na lua cheia</option>
            <option value="always">Sempre Evil</option>
          </select>
        </label>

        <div className="mt-5 grid gap-3">
          {BOOLEAN_GAME_VARIANT_OPTIONS.map((option) => (
            <label key={option.key} className="flex gap-3 rounded-xl border border-white/10 p-3">
              <input type="checkbox" checked={draft[option.key]} disabled={saving} onChange={(event) => setDraft((current) => ({ ...current, [option.key]: event.target.checked }))} className="mt-1 size-4 accent-[#7d2330]" />
              <span><span className="block font-semibold text-[#fffaf0]">{option.label}</span><span className="mt-1 block text-xs leading-5 text-[#aaa49b]">{option.description}</span></span>
            </label>
          ))}
        </div>

        <fieldset className="mt-5 rounded-xl border border-white/10 p-4">
          <legend className="px-1 text-sm font-semibold text-[#f4dfbd]">
            Roles possíveis do Amnesiac
          </legend>
          <p className="mb-3 text-xs leading-5 text-[#aaa49b]">
            Separe antes da partida as cartas que poderão ser sorteadas na Night 3.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.filter(({ id }) => id !== "amnesiac").map((role) => {
              const checked = amnesiacRolePool.includes(role.id);
              return (
                <label key={role.id} className="flex items-center gap-2 text-sm text-[#e5ded2]">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={saving}
                    onChange={() => setAmnesiacRolePool((current) =>
                      checked
                        ? current.filter((roleId) => roleId !== role.id)
                        : [...current, role.id].sort()
                    )}
                    className="size-4 accent-[#7d2330]"
                  />
                  {role.name}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={onCancel} className="min-h-11 rounded-xl border border-white/15 px-4 font-semibold text-[#d8d2c8]">Cancelar</button>
          <button type="button" disabled={saving} onClick={() => onConfirm(draft, amnesiacRolePool)} className="min-h-11 rounded-xl bg-[#7d2330] px-4 font-bold text-white disabled:opacity-50">{saving ? "Salvando…" : "Salvar variantes"}</button>
        </div>
      </section>
    </div>
  );
}
