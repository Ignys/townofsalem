"use client";

import { Bookmark, SlidersHorizontal, Trash2, WandSparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { firebaseAuth } from "@/lib/firebase/auth";

import { generateBalancedRoleComposition } from "./balanced-composition-generator";
import { getFeasibleFactionCounts } from "./composition-faction-constraints";
import {
  deleteCustomRolePreset,
  observeCustomRolePresets,
  saveCustomRolePreset,
  type CustomRolePreset,
} from "./custom-role-presets";
import { getRandomRoleSlot } from "./random-role-slots";
import {
  formatFactionCounts,
  getSuggestedFactionCounts,
  MAX_SUPPORTED_PLAYER_COUNT,
  MIN_SUPPORTED_PLAYER_COUNT,
} from "./suggested-faction-counts";

interface CompositionToolsProps {
  playerCount: number;
  /** Composição atual, que o moderador pode salvar para usar em outras salas. */
  roleIds: readonly string[];
  disabled: boolean;
  onApply: (roleIds: readonly string[]) => void;
}

export function CompositionTools({
  playerCount,
  roleIds,
  disabled,
  onApply,
}: CompositionToolsProps) {
  const [feedback, setFeedback] = useState("");
  const [presets, setPresets] = useState<CustomRolePreset[] | null>(null);
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const viewerUid = firebaseAuth.currentUser?.uid;
  const autoUnavailable =
    playerCount < MIN_SUPPORTED_PLAYER_COUNT || playerCount > MAX_SUPPORTED_PLAYER_COUNT;

  useEffect(() => observeCustomRolePresets(setPresets, () => setPresets([])), []);

  const handleSavePreset = async (event: FormEvent) => {
    event.preventDefault();
    const name = presetName.trim();
    if (!name || roleIds.length === 0 || savingPreset) return;
    setSavingPreset(true);
    try {
      await saveCustomRolePreset(name, roleIds);
      setFeedback(`Composição "${name}" salva.`);
      setPresetName("");
    } catch {
      setFeedback("Não foi possível salvar a composição. Tente de novo.");
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = async (preset: CustomRolePreset) => {
    if (!window.confirm(`Apagar a composição "${preset.name}" para todos os moderadores?`)) return;
    try {
      await deleteCustomRolePreset(preset.id);
      setFeedback(`Composição "${preset.name}" apagada.`);
    } catch {
      setFeedback("Não foi possível apagar a composição.");
    }
  };

  const applySuggestedComposition = (
    requestedPlayerCount: number,
    requiredRoleIds: readonly string[] = [],
    keptRoleIds: readonly string[] = [],
  ) => {
    const suggestedFactionCounts = getSuggestedFactionCounts(requestedPlayerCount);

    if (!suggestedFactionCounts) {
      setFeedback(
        `Escolha entre ${MIN_SUPPORTED_PLAYER_COUNT} e ${MAX_SUPPORTED_PLAYER_COUNT} jogadores.`,
      );
      return;
    }

    const factionCounts = getFeasibleFactionCounts(
      requestedPlayerCount,
      suggestedFactionCounts,
      requiredRoleIds,
      ROLE_DEFINITIONS,
    );

    if (!factionCounts) {
      setFeedback(
        "Não foi possível acomodar as roles obrigatórias com o baralho disponível.",
      );
      return;
    }

    const result = generateBalancedRoleComposition(
      requestedPlayerCount,
      factionCounts,
      ROLE_DEFINITIONS,
      requiredRoleIds,
    );

    if (!result.ok) {
      setFeedback(
        "Não foi possível gerar uma composição com o baralho disponível.",
      );
      return;
    }

    onApply([...result.roleIds, ...keptRoleIds]);
    setFeedback(
      `${requestedPlayerCount} jogadores (${formatFactionCounts(factionCounts)}) aplicada, Virtue ${result.virtueTotal > 0 ? "+" : ""}${result.virtueTotal}.`,
    );
  };

  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-[#fffaf0]">Composições</h2>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || autoUnavailable}
          onClick={() => applySuggestedComposition(playerCount)}
          className="flex flex-col items-start gap-2 rounded-xl border border-[#d3b88c]/40 bg-[#d3b88c]/[0.08] p-3 text-left transition-colors hover:bg-[#d3b88c]/15 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <WandSparkles aria-hidden="true" className="size-5 text-[#e6cfa9]" />
          <span>
            <span className="block text-sm font-semibold text-[#fffaf0]">Automática</span>
            <span className="block text-xs leading-4 text-[#a9a297]">Para {playerCount} jogadores</span>
          </span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            // ponytail: random slots are kept as-is and don't count toward faction balance.
            const randomSlots = roleIds.filter((id) => getRandomRoleSlot(id));
            const fixed = roleIds.filter((id) => !getRandomRoleSlot(id));
            applySuggestedComposition(playerCount - randomSlots.length, fixed, randomSlots);
          }}
          className="flex flex-col items-start gap-2 rounded-xl border border-white/10 p-3 text-left transition-colors hover:border-white/25 hover:bg-white/[0.04] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <SlidersHorizontal aria-hidden="true" className="size-5 text-[#bdb7ad]" />
          <span>
            <span className="block text-sm font-semibold text-[#fffaf0]">Semiautomática</span>
            <span className="block text-xs leading-4 text-[#a9a297]">Completa a atual</span>
          </span>
        </button>
      </div>

      <h3 className="mt-5 border-t border-white/10 pt-4 text-sm font-semibold text-[#d7d0c4]">Salvas</h3>
      {presets === null ? (
        <p role="status" className="mt-2 text-sm text-[#a9a297]">Carregando composições…</p>
      ) : presets.length === 0 ? (
        <p className="mt-2 text-sm leading-5 text-[#a9a297]">
          Nenhuma composição salva. Monte uma e salve abaixo para usar em qualquer sala.
        </p>
      ) : (
        <ul className="mt-2 grid gap-1">
          {presets.map((preset) => (
            <li key={preset.id} className="flex items-center gap-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onApply(preset.roleIds);
                  setFeedback(`Composição "${preset.name}" aplicada.`);
                }}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Bookmark aria-hidden="true" className="size-4 shrink-0 text-[#d3b88c]" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#fffaf0]">{preset.name}</span>
                <span className="shrink-0 text-xs text-[#a9a297] tabular-nums">{preset.roleIds.length} roles</span>
              </button>
              {preset.createdByUid === viewerUid && (
                <button
                  type="button"
                  onClick={() => void handleDeletePreset(preset)}
                  aria-label={`Apagar a composição ${preset.name}`}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-[#8f8a82] transition-colors hover:bg-[#a33843]/15 hover:text-[#f0b9bd] focus-visible:outline-2 focus-visible:outline-[#d3b88c]"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={(event) => void handleSavePreset(event)} className="mt-3 flex gap-2">
        <label htmlFor="preset-name" className="sr-only">
          Nome da composição atual
        </label>
        <input
          id="preset-name"
          value={presetName}
          maxLength={40}
          onChange={(event) => setPresetName(event.target.value)}
          placeholder="Nome da composição atual"
          disabled={disabled || roleIds.length === 0}
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/15 bg-black/20 px-3 text-sm text-[#fffaf0] outline-none placeholder:text-[#77726b] focus:border-[#d3b88c]/60 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || savingPreset || roleIds.length === 0 || !presetName.trim()}
          className="btn-quiet-dark min-h-10 px-3 text-xs"
        >
          {savingPreset ? "Salvando…" : "Salvar"}
        </button>
      </form>

      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-xs leading-5 text-[#bdb7ad]">
        {feedback}
      </p>

    </section>
  );
}
