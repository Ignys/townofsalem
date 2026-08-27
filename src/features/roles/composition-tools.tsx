"use client";

import { useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { GameVariantsDialog } from "@/features/game-variants/game-variants-dialog";
import { useGameVariants } from "@/features/game-variants/use-game-variants";

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
import { SlidersHorizontal } from "lucide-react";

interface CompositionToolsProps {
  gameId: string;
  playerCount: number;
  disabled: boolean;
  onApply: (roleIds: readonly string[]) => void;
}

export function CompositionTools({
  gameId,
  playerCount,
  disabled,
  onApply,
}: CompositionToolsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const gameVariants = useGameVariants(gameId);

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
      <header className="flex justify-between items-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#d3b88c] uppercase">
          PRESETS DE ROLES
        </p>
        <button type="button" disabled={disabled || !gameVariants.loaded} onClick={() => setVariantsOpen(true)} className="flex gap-2 items-center rounded-full bg-[#7d2330] border border-transparent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:bg-[#766c67]">
          <SlidersHorizontal size={18}/>
          VARIANTES
        </button>
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
      {variantsOpen && (
        <GameVariantsDialog
          initialVariants={gameVariants.variants}
          initialAmnesiacRolePool={gameVariants.amnesiacRolePool}
          roles={ROLE_DEFINITIONS}
          saving={gameVariants.saving}
          onCancel={() => setVariantsOpen(false)}
          onConfirm={(variants, amnesiacRolePool) => {
            void gameVariants.updateVariants(variants, amnesiacRolePool).then((saved) => {
              if (saved) {
                setVariantsOpen(false);
                setFeedback("Variantes da partida salvas.");
              }
            });
          }}
        />
      )}
    </section>
  );
}
