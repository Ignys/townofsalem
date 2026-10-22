"use client";

import { ChevronRight, Settings2 } from "lucide-react";
import { useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";

import { GameVariantsDialog } from "./game-variants-dialog";
import { useGameVariants } from "./use-game-variants";

/** Abre as regras da partida (variantes), ao lado da escolha do modo de jogo. */
/** row: linha inteira com seta, para o fim do card no celular. */
export function GameSettingsButton({ gameId, disabled = false, variant = "chip" }: Readonly<{ gameId: string; disabled?: boolean; variant?: "chip" | "row" }>) {
  const [open, setOpen] = useState(false);
  const gameVariants = useGameVariants(gameId);

  return (
    <>
      <button
        type="button"
        disabled={disabled || !gameVariants.loaded}
        onClick={() => setOpen(true)}
        className={
          variant === "row"
            ? "flex min-h-14 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-50"
            : "btn-quiet-dark flex min-h-9 items-center gap-1.5 px-2.5 text-xs"
        }
      >
        {variant === "row" ? (
          <>
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-[#d3b88c]">
              <Settings2 className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[#fffaf0]">Regras da partida</span>
              <span className="block text-xs text-[#a9a297]">Variantes, roles novas e sorteios</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[#8d877e]" />
          </>
        ) : (
          <>
            <Settings2 aria-hidden="true" className="size-4" />
            Configurações
          </>
        )}
      </button>
      {open && (
        <GameVariantsDialog
          initialVariants={gameVariants.variants}
          initialAmnesiacRolePool={gameVariants.amnesiacRolePool}
          initialRandomRoleExclusions={gameVariants.randomRoleExclusions}
          roles={ROLE_DEFINITIONS}
          saving={gameVariants.saving}
          onCancel={() => setOpen(false)}
          onConfirm={(variants, amnesiacRolePool, randomRoleExclusions) => {
            void gameVariants.updateVariants(variants, amnesiacRolePool, randomRoleExclusions).then((saved) => {
              if (saved) setOpen(false);
            });
          }}
        />
      )}
    </>
  );
}
