"use client";

import { useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import type { Faction } from "@/types";

import { BalanceSummary } from "./balance-summary";
import { calculateRoleBalance } from "./balance-score";
import { generateBalancedRoleComposition } from "./balanced-composition-generator";
import { ROLE_COMPOSITION_PRESETS } from "./role-presets";

interface CompositionToolsProps {
  playerCount: number;
  roleIds: readonly string[];
  disabled: boolean;
  onApply: (roleIds: readonly string[]) => void;
}

const FACTION_FIELDS: ReadonlyArray<{ key: Faction; label: string }> = [
  { key: "town", label: "Town" },
  { key: "mafia", label: "Mafia" },
  { key: "neutral", label: "Neutral" },
];

export function CompositionTools({
  playerCount,
  roleIds,
  disabled,
  onApply,
}: CompositionToolsProps) {
  const [presetId, setPresetId] = useState("");
  const [counts, setCounts] = useState<Record<Faction, string>>({
    town: String(playerCount),
    mafia: "0",
    neutral: "0",
  });
  const [feedback, setFeedback] = useState("");
  const balance = calculateRoleBalance(roleIds, ROLE_DEFINITIONS);

  const generate = () => {
    const factionCounts = {
      town: Number(counts.town),
      mafia: Number(counts.mafia),
      neutral: Number(counts.neutral),
    };
    const result = generateBalancedRoleComposition(
      playerCount,
      factionCounts,
      ROLE_DEFINITIONS,
    );

    if (!result.ok) {
      const detail = result.faction ? ` para ${result.faction}` : "";
      setFeedback(`Não foi possível gerar${detail}: ${result.code}.`);
      return;
    }

    onApply(result.roleIds);
    setFeedback(
      `Melhor composição encontrada: Virtue Value ${result.virtueTotal > 0 ? "+" : ""}${result.virtueTotal}.`,
    );
  };

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
      <h3 className="font-semibold">Preparação assistida</h3>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          aria-label="Preset de composição"
          value={presetId}
          disabled={disabled}
          onChange={(event) => setPresetId(event.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-[#161719] px-3"
        >
          <option value="">Composição manual</option>
          {ROLE_COMPOSITION_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || !presetId}
          onClick={() => {
            const preset = ROLE_COMPOSITION_PRESETS.find(
              ({ id }) => id === presetId,
            );
            if (preset) onApply(preset.roleIds);
          }}
          className="min-h-11 rounded-xl border border-white/15 px-3 font-bold disabled:opacity-50"
        >
          Aplicar preset
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {FACTION_FIELDS.map(({ key, label }) => (
          <label key={key} className="grid gap-1 text-xs font-semibold">
            {label}
            <input
              type="number"
              min={0}
              value={counts[key]}
              disabled={disabled}
              onChange={(event) =>
                setCounts((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className="min-h-10 rounded-lg border border-white/15 bg-[#161719] px-2"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={generate}
        className="mt-3 min-h-10 w-full rounded-xl border border-[#d3b88c]/30 px-3 text-sm font-bold text-[#e6cfa9] disabled:opacity-50"
      >
        Gerar composição mais balanceada
      </button>
      <p role="status" className="mt-2 min-h-5 text-xs text-[#bdb7ad]">
        {feedback}
      </p>
      <BalanceSummary balance={balance} />
    </section>
  );
}
