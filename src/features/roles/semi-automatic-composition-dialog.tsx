"use client";

import { useMemo, useState } from "react";

import type { RoleDefinition } from "@/types";

import { RequiredRolePicker } from "./required-role-picker";
import {
  MAX_SUPPORTED_PLAYER_COUNT,
  MIN_SUPPORTED_PLAYER_COUNT,
} from "./suggested-faction-counts";

interface SemiAutomaticCompositionDialogProps {
  initialPlayerCount: number;
  roles: readonly RoleDefinition[];
  onCancel: () => void;
  onConfirm: (
    playerCount: number,
    requiredRoleIds: readonly string[],
  ) => void;
}

export function SemiAutomaticCompositionDialog({
  initialPlayerCount,
  roles,
  onCancel,
  onConfirm,
}: SemiAutomaticCompositionDialogProps) {
  const [value, setValue] = useState(String(initialPlayerCount));
  const [requiredRoleCounts, setRequiredRoleCounts] = useState<
    Record<string, number>
  >({});
  const playerCount = Number(value);
  const requiredRoleIds = useMemo(
    () =>
      roles.flatMap((role) =>
        Array<string>(requiredRoleCounts[role.id] ?? 0).fill(role.id),
      ),
    [requiredRoleCounts, roles],
  );
  const validPlayerCount =
    Number.isInteger(playerCount) &&
    playerCount >= MIN_SUPPORTED_PLAYER_COUNT &&
    playerCount <= MAX_SUPPORTED_PLAYER_COUNT;
  const valid = validPlayerCount && requiredRoleIds.length <= playerCount;

  const handleRequiredRoleChange = (roleId: string, count: number) => {
    setRequiredRoleCounts((current) => ({ ...current, [roleId]: count }));
  };

  return (
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
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#1a1c1e] shadow-2xl"
      >
        <div className="overflow-y-auto p-5 sm:p-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#d3b88c] uppercase">
            Predefinição semiautomática
          </p>
          <h3
            id="semi-automatic-title"
            className="mt-2 font-serif text-2xl font-semibold text-[#fffaf0]"
          >
            Monte as regras da composição
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#bdb7ad]">
            Escolha de 4 a 36 jogadores e, se quiser, reserve as roles que
            precisam aparecer na partida.
          </p>

          <label className="mt-5 grid max-w-xs gap-2 text-sm font-semibold text-[#f8f1e5]">
            Número de jogadores
            <input
              autoFocus
              type="number"
              min={MIN_SUPPORTED_PLAYER_COUNT}
              max={MAX_SUPPORTED_PLAYER_COUNT}
              step={1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-12 rounded-xl border border-white/15 bg-[#111315] px-4 text-lg outline-none focus:border-[#d3b88c]/60"
            />
          </label>

          <RequiredRolePicker
            roles={roles}
            selectedRoleCounts={requiredRoleCounts}
            selectedCount={requiredRoleIds.length}
            playerCount={validPlayerCount ? playerCount : 0}
            onChange={handleRequiredRoleChange}
          />

          {!validPlayerCount ? (
            <p role="alert" className="mt-4 text-xs text-[#f0b9bd]">
              Escolha entre {MIN_SUPPORTED_PLAYER_COUNT} e{" "}
              {MAX_SUPPORTED_PLAYER_COUNT} jogadores.
            </p>
          ) : requiredRoleIds.length > playerCount ? (
            <p role="alert" className="mt-4 text-xs text-[#f0b9bd]">
              A quantidade de roles obrigatórias não pode superar o número de
              jogadores.
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/10 bg-[#151719] p-4 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-white/15 px-4 font-semibold text-[#d8d2c8] hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onConfirm(playerCount, requiredRoleIds)}
            className="min-h-11 rounded-xl bg-[#7d2330] px-4 font-bold text-white hover:bg-[#681c27] disabled:cursor-not-allowed disabled:bg-[#5d5552]"
          >
            Gerar composição
          </button>
        </div>
      </section>
    </div>
  );
}
