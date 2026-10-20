"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";

import { GameVariantsDialog } from "./game-variants-dialog";
import { useGameVariants } from "./use-game-variants";

/** Abre as regras da partida (variantes), ao lado da escolha do modo de jogo. */
export function GameSettingsButton({ gameId, disabled = false }: Readonly<{ gameId: string; disabled?: boolean }>) {
  const [open, setOpen] = useState(false);
  const gameVariants = useGameVariants(gameId);

  return (
    <>
      <button
        type="button"
        disabled={disabled || !gameVariants.loaded}
        onClick={() => setOpen(true)}
        className="btn-quiet-dark flex min-h-9 items-center gap-1.5 px-2.5 text-xs"
      >
        <Settings2 aria-hidden="true" className="size-4" />
        Configurações
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
