"use client";

import { Bookmark, SlidersHorizontal, Trash2, WandSparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { getRoleById } from "@/data/roles";
import type { RoleDefinition } from "@/types";
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
import { SemiAutomaticCompositionDialog } from "./semi-automatic-composition-dialog";
import {
  formatFactionCounts,
  getSuggestedFactionCounts,
  MAX_SUPPORTED_PLAYER_COUNT,
  MIN_SUPPORTED_PLAYER_COUNT,
} from "./suggested-faction-counts";

interface CompositionToolsProps {
  /** Roles que o moderador pode usar (sem as novas quando desativadas). */
  roles: readonly RoleDefinition[];
  playerCount: number;
  /** Composição atual, que o moderador pode salvar para usar em outras salas. */
  roleIds: readonly string[];
  disabled: boolean;
  respectCardCount: boolean;
  onRespectCardCountChange: (value: boolean) => void;
  onApply: (roleIds: readonly string[]) => void;
  /** "mobile": blocos grandes e composições salvas com a proporção das facções. */
  layout?: "desktop" | "mobile";
}

const FACTION_BAR = [
  { faction: "town", color: "#3dd69b" },
  { faction: "mafia", color: "#db4242" },
  { faction: "neutral", color: "#a8a8a8" },
  { faction: "any", color: "#d3b88c" },
] as const;

/** Proporção de cada facção numa composição salva; slots aleatórios contam pela facção do slot. */
function factionShares(roleIds: readonly string[]) {
  const counts: Record<string, number> = {};
  for (const id of roleIds) {
    const faction = getRoleById(id)?.faction ?? getRandomRoleSlot(id)?.faction ?? "any";
    counts[faction] = (counts[faction] ?? 0) + 1;
  }
  return FACTION_BAR.map((entry) => ({ ...entry, count: counts[entry.faction] ?? 0 })).filter(({ count }) => count > 0);
}

export function CompositionTools({
  roles,
  playerCount,
  roleIds,
  disabled,
  respectCardCount,
  onRespectCardCountChange,
  onApply,
  layout = "desktop",
}: CompositionToolsProps) {
  const [feedback, setFeedback] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
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
    excludedRoleIds: readonly string[] = [],
    exactRoleCounts: Readonly<Record<string, number>> = {},
  ) => {
    // Without the card cap any role can repeat, so every role gets enough copies.
    const catalog = roles.filter((role) => !excludedRoleIds.includes(role.id)).map((role) =>
      exactRoleCounts[role.id] !== undefined
        ? { ...role, cardCount: exactRoleCounts[role.id] }
        : respectCardCount ? role : { ...role, cardCount: Math.max(role.cardCount, requestedPlayerCount) },
    );
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
      catalog,
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
      catalog,
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

  const completeCurrent = () => {
    // ponytail: random slots are kept as-is and don't count toward faction balance.
    const randomSlots = roleIds.filter((id) => getRandomRoleSlot(id));
    const fixed = roleIds.filter((id) => !getRandomRoleSlot(id));
    applySuggestedComposition(playerCount - randomSlots.length, fixed, randomSlots);
  };

  const semiAutomaticDialog = dialogOpen && (
    <SemiAutomaticCompositionDialog
      initialPlayerCount={autoUnavailable ? 10 : playerCount}
      roles={roles}
      respectCardCount={respectCardCount}
      onRespectCardCountChange={onRespectCardCountChange}
      onCancel={() => setDialogOpen(false)}
      onConfirm={(requestedPlayerCount, requiredRoleIds, excludedRoleIds, exactRoleCounts) => {
        applySuggestedComposition(requestedPlayerCount, requiredRoleIds, [], excludedRoleIds, exactRoleCounts);
        setDialogOpen(false);
      }}
    />
  );

  if (layout === "mobile") {
    const tileClass =
      "flex min-h-24 flex-col items-start justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-left transition-colors active:bg-white/[0.06] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-45";
    return (
      <section aria-labelledby="composition-tools-title">
        <h2 id="composition-tools-title" className="font-serif text-lg font-semibold text-[#fffaf0]">
          Composições
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button type="button" disabled={disabled || autoUnavailable} onClick={completeCurrent} className={tileClass}>
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-[#d3b88c]/12 text-[#d3b88c]">
              <WandSparkles className="size-5" />
            </span>
            <span>
              <span className="block font-semibold text-[#fffaf0]">Automática</span>
              <span className="block text-xs text-[#8d877e]">Completa para {playerCount}</span>
            </span>
          </button>
          <button type="button" disabled={disabled} onClick={() => setDialogOpen(true)} className={tileClass}>
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-white/[0.06] text-[#d7d0c4]">
              <SlidersHorizontal className="size-5" />
            </span>
            <span>
              <span className="block font-semibold text-[#fffaf0]">Semiautomática</span>
              <span className="block text-xs text-[#8d877e]">Você escolhe o que entra</span>
            </span>
          </button>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-[#d7d0c4]">Salvas</h3>
        {presets === null ? (
          <p role="status" className="mt-2 text-sm text-[#a9a297]">Carregando composições…</p>
        ) : presets.length === 0 ? (
          <p className="mt-2 text-sm text-[#8d877e]">Nenhuma salva ainda.</p>
        ) : (
          <ul className="mt-1">
            {presets.map((preset) => (
              <li key={preset.id} className="flex items-center gap-1 border-b border-white/7 last:border-b-0">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onApply(preset.roleIds);
                    setFeedback(`Composição "${preset.name}" aplicada.`);
                  }}
                  className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-xl py-2 text-left transition-colors active:bg-white/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-45"
                >
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d3b88c]/10 text-[#d3b88c]">
                    <Bookmark className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[#fffaf0]">{preset.name}</span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <span aria-hidden="true" className="flex h-1.5 w-24 overflow-hidden rounded-full bg-white/8">
                        {factionShares(preset.roleIds).map(({ faction, color, count }) => (
                          <span key={faction} style={{ flexGrow: count, backgroundColor: color }} />
                        ))}
                      </span>
                      <span className="text-xs text-[#8d877e] tabular-nums">{preset.roleIds.length} roles</span>
                    </span>
                  </span>
                </button>
                {preset.createdByUid === viewerUid && (
                  <button
                    type="button"
                    onClick={() => void handleDeletePreset(preset)}
                    aria-label={`Apagar a composição ${preset.name}`}
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-[#6f6a63] transition-colors active:bg-[#a33843]/15 active:text-[#f0b9bd] focus-visible:outline-2 focus-visible:outline-[#d3b88c]"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={(event) => void handleSavePreset(event)} className="mt-4 flex gap-2">
          <label htmlFor="preset-name-mobile" className="sr-only">
            Nome da composição atual
          </label>
          <input
            id="preset-name-mobile"
            value={presetName}
            maxLength={40}
            onChange={(event) => setPresetName(event.target.value)}
            placeholder="Salvar a atual como…"
            enterKeyHint="done"
            disabled={disabled || roleIds.length === 0}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/25 px-3.5 text-base text-[#fffaf0] outline-none placeholder:text-[#6f6a63] focus:border-[#d3b88c]/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || savingPreset || roleIds.length === 0 || !presetName.trim()}
            className="btn-quiet-dark min-h-12 rounded-xl px-4"
          >
            {savingPreset ? "Salvando…" : "Salvar"}
          </button>
        </form>

        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs leading-5 text-[#bdb7ad]">
          {feedback}
        </p>
        {semiAutomaticDialog}
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-[#fffaf0]">Composições</h2>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || autoUnavailable}
          onClick={completeCurrent}
          title={`Completa a composição atual para ${playerCount} jogadores`}
          className="flex min-h-9 items-center gap-2 rounded-lg border border-white/10 px-2.5 text-left text-xs font-semibold text-[#d7d0c4] transition-colors hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <WandSparkles aria-hidden="true" className="size-3.5 shrink-0 text-[#a9a297]" />
          Automática
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDialogOpen(true)}
          title="Escolha suas preferências"
          className="flex min-h-9 items-center gap-2 rounded-lg border border-white/10 px-2.5 text-left text-xs font-semibold text-[#d7d0c4] transition-colors hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <SlidersHorizontal aria-hidden="true" className="size-3.5 shrink-0 text-[#a9a297]" />
          Semiautomática
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

      {semiAutomaticDialog}
    </section>
  );
}
