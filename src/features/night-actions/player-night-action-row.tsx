"use client";

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
}: PlayerNightActionRowProps) {
  const blocked = disabled || exhausted;
  const { selectedTargetUids, setTarget, recorded, error, recordNoTargetAction, clear } =
    usePlayerNightAction({
      gameId,
      nightId,
      nightNumber,
      interaction,
      submission,
      disabled: blocked,
    });
  const targets = getPlayerNightTargets(interaction, players, variants);
  const { action } = interaction;
  const targetCount = action.targetCount;

  return (
    <li className="rounded-2xl border border-[#3b4a6b]/40 bg-black/25 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg font-semibold text-[#fffaf0]">{action.label}</h3>
        {recorded && !exhausted && (
          <span className="rounded-full border border-[#6f9b77]/40 bg-[#6f9b77]/10 px-2 py-0.5 text-xs font-bold text-[#bfe0c5]">
            Enviado
          </span>
        )}
      </div>

      {exhausted ? (
        <p className="mt-2 text-sm text-[#9f9990]">Você já usou todos os usos desta ação.</p>
      ) : targetCount === 0 ? (
        <div className="mt-3">
          <button
            type="button"
            disabled={blocked || recorded}
            onClick={recordNoTargetAction}
            className="min-h-11 rounded-xl border border-[#d3b88c]/40 bg-[#d3b88c]/15 px-4 text-sm font-bold text-[#fffaf0] disabled:opacity-50"
          >
            {recorded ? "Ação registrada" : "Registrar ação"}
          </button>
        </div>
      ) : (
        Array.from({ length: targetCount }, (_, targetIndex) => (
          <fieldset key={targetIndex} className="mt-3" disabled={blocked}>
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
                    disabled={blocked || takenByOtherSlot}
                    onClick={() => setTarget(targetIndex, target.uid)}
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

      {recorded && !exhausted && (
        <button
          type="button"
          disabled={blocked}
          onClick={clear}
          className="mt-3 min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-[#bdb7ad] disabled:opacity-50"
        >
          Cancelar minha ação
        </button>
      )}

      <p role="alert" className="mt-2 min-h-5 text-sm text-[#f0b9bd]">
        {error ?? ""}
      </p>
    </li>
  );
}
