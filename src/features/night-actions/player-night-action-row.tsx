"use client";

import { useState } from "react";

import type { NightConsoleInteraction } from "@/features/lobby/night-console-interactions";
import type { GameVariants } from "@/game-engine/variants";
import type { Player, PlayerNightActionSubmission } from "@/types";

import { getPlayerNightTargets } from "./player-night-interactions";
import { usePlayerNightAction } from "./use-player-night-action";

interface PlayerNightActionRowProps {
  gameId: string;
  nightId: string;
  nightNumber: number;
  interaction: NightConsoleInteraction;
  players: readonly Player[];
  submission?: PlayerNightActionSubmission;
  variants: GameVariants;
  disabled: boolean;
  exhausted: boolean;
  shareWithMafia?: boolean;
  /** Quem não aparece como alvo (ex.: parceiros da Máfia). */
  excludedTargetUids?: readonly string[];
}

export function PlayerNightActionRow({
  gameId,
  nightId,
  nightNumber,
  interaction,
  players,
  submission,
  variants,
  disabled,
  exhausted,
  shareWithMafia = false,
  excludedTargetUids = [],
}: PlayerNightActionRowProps) {
  const blocked = disabled || exhausted;
  const { selectedTargetUids, setTarget, locked, saving, error, chosenCount, confirm, skip, skipped, cancel } =
    usePlayerNightAction({
      gameId,
      nightId,
      nightNumber,
      interaction,
      submission,
      disabled: blocked,
      shareWithMafia,
    });
  const targets = getPlayerNightTargets(interaction, players, variants, excludedTargetUids);
  const { action } = interaction;
  const targetCount = action.targetCount;
  const [confirmingPartial, setConfirmingPartial] = useState(false);
  const partial = targetCount > 0 && chosenCount < targetCount;

  const handleConfirm = () => {
    if (partial && !confirmingPartial) {
      setConfirmingPartial(true);
      return;
    }
    setConfirmingPartial(false);
    confirm();
  };

  const handleSkip = () => {
    setConfirmingPartial(false);
    skip();
  };

  const handleCancel = () => {
    setConfirmingPartial(false);
    cancel();
  };

  return (
    <li className="rounded-2xl border border-[#3b4a6b]/40 bg-black/25 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg font-semibold text-[#fffaf0]">{action.label}</h3>
        {locked && !exhausted && (
          <span className="rounded-full border border-[#6f9b77]/40 bg-[#6f9b77]/10 px-2 py-0.5 text-xs font-bold text-[#bfe0c5]">
            {skipped ? "Pulou" : "Confirmado"}
          </span>
        )}
      </div>

      {exhausted ? (
        <p className="mt-2 text-sm text-[#9f9990]">Você já usou todos os usos desta ação.</p>
      ) : skipped ? (
        <p className="mt-2 text-sm text-[#9f9990]">Você pulou esta ação nesta noite.</p>
      ) : targetCount === 0 ? (
        <p className="mt-2 text-sm text-[#9f9990]">
          {locked ? "Ação registrada para esta noite." : "Esta ação não tem alvo."}
        </p>
      ) : (
        Array.from({ length: targetCount }, (_, targetIndex) => (
          <fieldset key={targetIndex} className="mt-3" disabled={blocked || locked || saving}>
            <legend className="text-xs font-bold tracking-[0.15em] text-[#9f9990] uppercase">
              {targetCount > 1 ? `${action.verb} — alvo ${targetIndex + 1}` : action.verb}
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {targets.map((target) => {
                const selected = selectedTargetUids[targetIndex] === target.uid;
                const takenByOtherSlot = selectedTargetUids.some(
                  (uid, index) => index !== targetIndex && uid === target.uid,
                );

                return (
                  <button
                    key={target.uid}
                    type="button"
                    aria-pressed={selected}
                    disabled={blocked || locked || saving || takenByOtherSlot}
                    onClick={() => {
                      setConfirmingPartial(false);
                      setTarget(targetIndex, target.uid);
                    }}
                    className={`min-h-12 rounded-xl border px-4 py-3 text-left font-bold disabled:opacity-40 ${
                      selected
                        ? "border-[#d3b88c] bg-[#d3b88c]/20 text-[#fffaf0]"
                        : "border-white/10 bg-white/5 text-[#e5ded2]"
                    }`}
                  >
                    {target.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))
      )}

      {!locked && !exhausted && (
        <>
          {confirmingPartial && (
            <p className="mt-3 text-sm text-[#e6cfa9]">
              Você escolheu {chosenCount} de {targetCount} alvos. Depois de confirmar, não dá para
              mudar. Confirmar mesmo assim?
            </p>
          )}
          <div className={`mt-3 grid gap-2 ${targetCount > 0 ? "grid-cols-2" : ""}`}>
            {targetCount > 0 && (
              <button
                type="button"
                disabled={blocked || saving || chosenCount === 0}
                onClick={handleCancel}
                className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-[#bdb7ad] disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              disabled={blocked || saving || (targetCount > 0 && chosenCount === 0)}
              onClick={handleConfirm}
              className="min-h-11 rounded-xl border border-[#d3b88c]/40 bg-[#d3b88c]/15 px-4 text-sm font-bold text-[#fffaf0] disabled:opacity-50"
            >
              {saving ? "Enviando…" : confirmingPartial ? "Confirmar mesmo assim" : "Confirmar"}
            </button>
          </div>
          <button
            type="button"
            disabled={blocked || saving}
            onClick={handleSkip}
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 px-4 text-sm font-bold text-[#bdb7ad] disabled:opacity-50"
          >
            Pular esta ação
          </button>
        </>
      )}

      <p role="alert" className="mt-2 min-h-5 text-sm text-[#f0b9bd]">
        {error ?? ""}
      </p>
    </li>
  );
}
