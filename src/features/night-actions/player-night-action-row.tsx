"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

import type { NightConsoleInteraction } from "@/features/lobby/night-console-interactions";
import { getRoleById } from "@/data/roles";
import { FACTION_TAGS } from "@/features/game-state/game-composition-board";
import { arePlayersAdjacent } from "@/game-engine/role-rules";
import type { GameVariants } from "@/game-engine/variants";
import type { Player, PlayerNightActionSubmission } from "@/types";

import type { NightTargetPicker } from "./night-target-picker";
import { getPlayerNightTargets } from "./player-night-interactions";
import { usePlayerNightAction } from "./use-player-night-action";

const FACTION_ORDER = ["town", "mafia", "neutral"];
const FACTION_LABEL: Record<string, string> = {
  town: "Cidade",
  mafia: "Máfia",
  neutral: "Neutro",
};

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
  amnesiacRolePool?: readonly string[];
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
  amnesiacRolePool = [],
  active,
  onActivate,
  onPickerChange,
  showSelector,
}: PlayerNightActionRowProps) {
  const blocked = disabled || exhausted;
  const {
    selectedTargetUids,
    setTarget,
    replaceTargets,
    error,
    chosenCount,
    active: switchedOn,
    toggle,
    chosenRoleId,
    chooseRole,
  } = usePlayerNightAction({
    gameId,
    nightId,
    nightNumber,
    interaction,
    submission,
    disabled: blocked,
    shareWithMafia,
  });
  const allTargets = getPlayerNightTargets(
    interaction,
    players,
    variants,
    excludedTargetUids,
  );
  const { action } = interaction;
  const targetCount = action.targetCount;
  // Werewolf: depois do alvo principal, só os vizinhos dele podem ser o segundo.
  const adjacentPair = action.targetRelation === "adjacent-pair";
  const primaryTarget = adjacentPair ? players.find(({ uid }) => uid === selectedTargetUids[0]) : undefined;
  const targets = primaryTarget
    ? allTargets.filter((player) =>
        player.uid === primaryTarget.uid || arePlayersAdjacent(primaryTarget, player, players),
      )
    : allTargets;

  // Tocar num alvo escolhido o remove; senão ocupa o próximo espaço livre (ou troca o último).
  const toggleTarget = (uid: string) => {
    if (adjacentPair) {
      const [primary, neighbor] = selectedTargetUids;
      // Tirar o principal desfaz os dois: o vizinho só vale ao lado dele.
      if (uid === primary) return replaceTargets([]);
      if (uid === neighbor) return replaceTargets([primary]);
      return replaceTargets(primary ? [primary, uid] : [uid]);
    }
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
      ...(adjacentPair && selectedKey.split(",")[0] ? { primaryUid: selectedKey.split(",")[0] } : {}),
      disabled: false,
      toggle: (uid) => toggleRef.current(uid),
    });
    return () => onPickerChange(null);
  }, [picking, eligibleKey, selectedKey, adjacentPair, onPickerChange]);

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
      ) : action.id === "remember-role" ? (
        // Amnesiac: uma lista simples; na variante de escolha, cada linha se marca como um rádio.
        <div className="w-full">
          {amnesiacRolePool.length === 0 ? (
            <p className="text-sm text-[#9f9990]">O mestre ainda não separou as roles possíveis.</p>
          ) : (
            <ul
              aria-label="Roles possíveis"
              className="divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8"
            >
              {[...amnesiacRolePool]
                .map((roleId) => getRoleById(roleId))
                .filter((role) => role !== undefined)
                .sort((left, right) => FACTION_ORDER.indexOf(left.faction) - FACTION_ORDER.indexOf(right.faction))
                .map((role) => {
                  const picked = chosenRoleId === role.id;
                  const content = (
                    <>
                      <span
                        className={`w-14 shrink-0 rounded-md border py-0.5 text-center text-[0.6875rem] leading-4 font-semibold uppercase ${
                          FACTION_TAGS[role.faction] ?? FACTION_TAGS.neutral
                        }`}
                      >
                        {FACTION_LABEL[role.faction] ?? "Neutro"}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-[#fffaf0]">{role.name}</span>
                    </>
                  );
                  return (
                    <li key={role.id}>
                      {variants.amnesiacPicksRole ? (
                        <button
                          type="button"
                          disabled={blocked}
                          onClick={() => chooseRole(role.id)}
                          aria-pressed={picked}
                          className="flex min-h-12 w-full items-center gap-3 px-3.5 text-left text-sm transition-colors hover:bg-white/4 aria-pressed:bg-[#c9d4ef]/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c9d4ef] disabled:opacity-50"
                        >
                          {content}
                          <span
                            aria-hidden="true"
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              picked ? "border-[#c9d4ef] bg-[#c9d4ef]" : "border-white/25"
                            }`}
                          >
                            {picked && <Check className="size-3.5 text-[#1b1d20]" strokeWidth={3} />}
                          </span>
                        </button>
                      ) : (
                        <div className="flex min-h-12 items-center gap-3 px-3.5 text-sm">{content}</div>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
          {!variants.amnesiacPicksRole && amnesiacRolePool.length > 0 && (
            <button
              type="button"
              disabled={blocked}
              onClick={toggle}
              aria-pressed={switchedOn}
              className={`${switchedOn ? "btn-primary" : "btn-quiet-dark"} mt-3 w-full`}
            >
              {switchedOn ? "Desfazer" : "Lembrar uma role"}
            </button>
          )}
        </div>
      ) : targetCount === 0 ? (
        <button
          type="button"
          disabled={blocked}
          onClick={toggle}
          aria-pressed={switchedOn}
          className={`${switchedOn ? "btn-primary" : "btn-quiet-dark"} w-full`}
        >
          {action.id === "alert"
            ? switchedOn
              ? "Desfazer alerta"
              : "Entrar em alerta"
            : switchedOn
              ? `${action.label}: ativado (toque para desfazer)`
              : `Ativar ${action.label}`}
        </button>
      ) : showSelector ? (
        <button
          type="button"
          onClick={onActivate}
          aria-pressed={active}
          className="min-h-9 rounded-full border border-white/15 px-3 text-xs font-bold text-[#d7d0c4] transition-colors aria-pressed:border-[#c9d4ef] aria-pressed:bg-[#c9d4ef] aria-pressed:text-[#1b1d20]"
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
