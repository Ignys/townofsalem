"use client";

import { useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";

import { generateBalancedRoleComposition } from "./balanced-composition-generator";
import { getFeasibleFactionCounts } from "./composition-faction-constraints";
import { ROLE_COMPOSITION_PRESETS } from "./role-presets";
import { SemiAutomaticCompositionDialog } from "./semi-automatic-composition-dialog";
import {
  formatFactionCounts,
  getSuggestedFactionCounts,
  MAX_SUPPORTED_PLAYER_COUNT,
  MIN_SUPPORTED_PLAYER_COUNT,
} from "./suggested-faction-counts";

interface CompositionToolsProps {
  playerCount: number;
  disabled: boolean;
  onApply: (roleIds: readonly string[]) => void;
}

export function CompositionTools({
  playerCount,
  disabled,
  onApply,
}: CompositionToolsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const applySuggestedComposition = (
    requestedPlayerCount: number,
    requiredRoleIds: readonly string[] = [],
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

    onApply(result.roleIds);
    setFeedback(
      `${requestedPlayerCount} jogadores (${formatFactionCounts(factionCounts)}) aplicada · Virtue ${result.virtueTotal > 0 ? "+" : ""}${result.virtueTotal}.`,
    );
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-black/15 p-4 sm:p-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.18em] text-[#d3b88c] uppercase">
          PRESETS DE ROLES
        </p>
      </header>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          disabled={
            disabled ||
            playerCount < MIN_SUPPORTED_PLAYER_COUNT ||
            playerCount > MAX_SUPPORTED_PLAYER_COUNT
          }
          onClick={() => applySuggestedComposition(playerCount)}
          className="rounded-xl border border-[#d3b88c]/35 bg-[#d3b88c]/8 px-3 py-2 text-left transition hover:border-[#d3b88c]/60 hover:bg-[#d3b88c]/12 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="block font-medium text-sm text-[#f4dfbd]">
            Predefinição automática
          </span>
          <span className=" block text-xs leading-5 text-[#aaa49b]">
            Baseado nos jogadores conectados.
          </span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDialogOpen(true)}
          className="rounded-xl border border-white/15 px-3 py-2 text-left transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="block font-medium text-sm text-[#f8f1e5]">
            Predefinição semiautomática
          </span>
          <span className=" block text-xs leading-5 text-[#9f9990]">
            Escolha suas preferências
          </span>
        </button>
      </div>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="text-[10px] font-bold tracking-[0.18em] text-[#77726b] uppercase">
          Composições prontas
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid gap-2">
        {ROLE_COMPOSITION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              onApply(preset.roleIds);
              setFeedback(`${preset.label} aplicada · Virtue 0.`);
            }}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#161719] px-3 py-2 text-left transition hover:border-[#d3b88c]/40 hover:bg-[#201e1c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>
              <span className="block font-medium text-sm text-[#fffaf0]">
                {preset.label}
              </span>
            </span>
            <span className="shrink-0 rounded-lg bg-[#6f9b77]/12 px-2 py-1 text-xs font-bold text-[#bfe0c5]">
              Virtue 0
            </span>
          </button>
        ))}
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-4 min-h-5 text-xs leading-5 text-[#bdb7ad]"
      >
        {feedback}
      </p>

      {dialogOpen && (
        <SemiAutomaticCompositionDialog
          initialPlayerCount={
            playerCount >= MIN_SUPPORTED_PLAYER_COUNT &&
            playerCount <= MAX_SUPPORTED_PLAYER_COUNT
              ? playerCount
              : 10
          }
          roles={ROLE_DEFINITIONS}
          onCancel={() => setDialogOpen(false)}
          onConfirm={(requestedPlayerCount, requiredRoleIds) => {
            applySuggestedComposition(requestedPlayerCount, requiredRoleIds);
            setDialogOpen(false);
          }}
        />
      )}
    </section>
  );
}
