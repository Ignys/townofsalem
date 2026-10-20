"use client";

import { useEffect, useRef } from "react";

import type { NightConsoleInteraction } from "@/features/lobby/night-console-interactions";
import type { GameVariants } from "@/game-engine/variants";
import type { Player, PlayerNightActionSubmission } from "@/types";

import type { NightTargetPicker } from "./night-target-picker";
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
  /** Esta ação usa a lista de jogadores para escolher alvos agora. */
  active: boolean;
  onActivate: () => void;
  onPickerChange?: (picker: NightTargetPicker | null) => void;
  /** Mais de uma ação: mostra um seletor para a lista saber qual alvo está escolhendo. */
  showSelector: boolean;
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
  active,
  onActivate,
  onPickerChange,
  showSelector,
}: PlayerNightActionRowProps) {
  const blocked = disabled || exhausted;
  const {
    selectedTargetUids,
    setTarget,
    error,
    chosenCount,
    active: switchedOn,
    toggle,
  } = usePlayerNightAction({
    gameId,
    nightId,
    nightNumber,
    interaction,
    submission,
    disabled: blocked,
    shareWithMafia,
  });
  const targets = getPlayerNightTargets(
    interaction,
    players,
    variants,
    excludedTargetUids,
  );
  const { action } = interaction;
  const targetCount = action.targetCount;

  // Tocar num alvo escolhido o remove; senão ocupa o próximo espaço livre (ou troca o último).
  const toggleTarget = (uid: string) => {
    const index = selectedTargetUids.indexOf(uid);
    if (index >= 0) return setTarget(index, uid);
    const emptyIndex = Array.from(
      { length: targetCount },
      (_, slot) => slot,
    ).find((slot) => !selectedTargetUids[slot]);
    setTarget(emptyIndex ?? targetCount - 1, uid);
  };
  const toggleRef = useRef(toggleTarget);
  useEffect(() => {
    toggleRef.current = toggleTarget;
  });

  const picking = active && !blocked && targetCount > 0;
  const eligibleKey = targets.map(({ uid }) => uid).join(",");
  const selectedKey = selectedTargetUids.join(",");
  useEffect(() => {
    if (!picking || !onPickerChange) return;
    onPickerChange({
      eligibleUids: eligibleKey ? eligibleKey.split(",") : [],
      selectedUids: selectedKey.split(",").filter(Boolean),
      disabled: false,
      toggle: (uid) => toggleRef.current(uid),
    });
    return () => onPickerChange(null);
  }, [picking, eligibleKey, selectedKey, onPickerChange]);

  const chosenNames = selectedTargetUids
    .filter(Boolean)
    .map((uid) => players.find((player) => player.uid === uid)?.name ?? "?");

  const chosen = targetCount > 0 ? chosenCount > 0 : switchedOn;

  // Sem cartão: a escolha acontece na lista de jogadores. Aqui só fica o que a lista não cobre.
  return (
    <li className="contents">
      {exhausted ? (
        <p className="w-full text-sm text-[#9f9990]">
          Você já usou todos os usos de {action.label}.
        </p>
      ) : targetCount === 0 ? (
        <button
          type="button"
          disabled={blocked}
          onClick={toggle}
          aria-pressed={switchedOn}
          className={`${switchedOn ? "btn-primary" : "btn-quiet-dark"} w-full`}
        >
          {switchedOn
            ? `${action.label}: ativado (toque para desfazer)`
            : `Ativar ${action.label}`}
        </button>
      ) : showSelector ? (
        <button
          type="button"
          onClick={onActivate}
          aria-pressed={active}
          className="min-h-9 rounded-full border border-white/15 px-3 text-xs font-bold text-[#d7d0c4] transition-colors aria-pressed:border-[#c9d4ef] aria-pressed:bg-[#c9d4ef] aria-pressed:text-[#161b28]"
        >
          {action.label}
          {chosen && ` · ${chosenNames.join(", ")}`}
        </button>
      ) : null}
      {error && (
        <p role="alert" className="w-full text-sm text-[#f0b9bd]">
          {error}
        </p>
      )}
    </li>
  );
}
