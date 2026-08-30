"use client";

import { useMemo, useState } from "react";

import { HostConsoleFrame } from "@/components/host/host-console-frame";
import { ROLE_DEFINITIONS } from "@/data/roles";
import { createEngineGameState } from "@/game-engine/host-action-adapter";
import {
  resolveAssistedDayDeath,
  type AssistedDayDeathKind,
} from "@/game-engine/resolve-day";
import { NightTargetCombobox } from "@/features/lobby/night-target-combobox";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";
import type { Player } from "@/types";

import { applyDayResolution } from "./apply-day-resolution";

interface HostDayResolutionPanelProps {
  gameId: string;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>>;
  /** Pré-seleciona o alvo — usado pelo veredito digital com resultado "culpado". */
  initialTargetUid?: string;
  initialKind?: AssistedDayDeathKind;
  /** Impede trocar o alvo quando ele veio de um veredito digital. */
  lockedTarget?: boolean;
}

const DEATH_KIND_OPTIONS: readonly { id: AssistedDayDeathKind; label: string; hint: string }[] = [
  {
    id: "lynch",
    label: "Linchado pela cidade",
    hint: "A cidade votou e enforcou. O Executioner que observava este alvo vence.",
  },
  {
    id: "other-day",
    label: "Morreu de outra forma no dia",
    hint: "Qualquer morte diurna que não seja um linchamento.",
  },
];

export function HostDayResolutionPanel({
  gameId,
  players,
  assignments,
  privatePlayers,
  initialTargetUid,
  initialKind,
  lockedTarget = false,
}: HostDayResolutionPanelProps) {
  const [targetUid, setTargetUid] = useState(initialTargetUid ?? "");
  const [kind, setKind] = useState<AssistedDayDeathKind>(initialKind ?? "lynch");
  const [revengeTargetUid, setRevengeTargetUid] = useState("");
  const [executionerBecomesJester, setExecutionerBecomesJester] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const variants = useGameVariants(gameId);

  const alivePlayers = useMemo(
    () => players.filter(({ alive }) => alive),
    [players],
  );
  const playerNames = useMemo(
    () => Object.fromEntries(players.map(({ uid, name }) => [uid, name])),
    [players],
  );

  const engineState = useMemo(() => createEngineGameState({
    gameId,
    nightId: "day-preview",
    nightNumber: 1,
    players: [...players],
    assignments,
    privatePlayerStates: privatePlayers,
    roleDefinitions: ROLE_DEFINITIONS,
    variants: variants.variants,
  }), [gameId, players, assignments, privatePlayers, variants.variants]);

  const target = alivePlayers.find(({ uid }) => uid === targetUid);
  const targetIsJester = target ? assignments[target.uid] === "jester" : false;
  const needsRevengeTarget = kind === "lynch" && targetIsJester;

  // Preview runs the very same pure resolver the write path uses.
  const preview = useMemo(() => {
    if (!targetUid) return null;
    try {
      return resolveAssistedDayDeath(engineState, {
        targetUid,
        kind,
        ...(needsRevengeTarget && revengeTargetUid
          ? { jesterRevengeTargetUid: revengeTargetUid }
          : {}),
        ...(executionerBecomesJester === null
          ? {}
          : { executionerBecomesJester }),
      });
    } catch {
      return null;
    }
  }, [engineState, targetUid, kind, needsRevengeTarget, revengeTargetUid, executionerBecomesJester]);

  const pendingExecutioners = preview?.pendingExecutionerDecisionUids ?? [];
  // The pending-decision warning names a raw uid and duplicates the prompt below it.
  const visibleWarnings = (preview?.warnings ?? []).filter(
    ({ code }) => code !== "EXECUTIONER_TARGET_OTHER_DAY_DEATH_REQUIRES_HOST_DECISION",
  );
  const blocked = !preview
    || preview.warnings.length > 0
    || pendingExecutioners.length > 0;

  const apply = async () => {
    if (busy || !targetUid || blocked) return;
    setBusy(true);
    setFeedback("");
    try {
      await applyDayResolution(gameId, {
        targetUid,
        kind,
        ...(needsRevengeTarget && revengeTargetUid
          ? { jesterRevengeTargetUid: revengeTargetUid }
          : {}),
        ...(executionerBecomesJester === null
          ? {}
          : { executionerBecomesJester }),
      });
      setFeedback("Resultado do dia aplicado. A fase não foi alterada.");
      if (!lockedTarget) setTargetUid("");
      setRevengeTargetUid("");
      setExecutionerBecomesJester(null);
    } catch (error: unknown) {
      console.error("[HostDayResolutionPanel] Falha ao aplicar o resultado do dia.", {
        error,
        gameId,
        targetUid,
        kind,
      });
      setFeedback("Não foi possível aplicar o resultado do dia. Consulte o console.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <HostConsoleFrame title="Resolução do dia" contentClassName="mt-3 grid gap-4">
      <div className="grid gap-2">
        <span className="text-xs font-semibold tracking-wide text-[#aaa49b] uppercase">
          Quem morreu
        </span>
        {lockedTarget ? (
          <p className="rounded-xl border border-[#d3b88c]/30 bg-[#d3b88c]/10 px-3 py-2 text-sm text-[#fffaf0]">
            <strong>{playerNames[targetUid] ?? "indisponível"}</strong> — condenado pelo veredito
            da mesa.
          </p>
        ) : (
          <NightTargetCombobox
            ariaLabel="Jogador que morreu durante o dia"
            players={alivePlayers}
            assignments={assignments}
            value={targetUid}
            onChange={(uid) => {
              setTargetUid(uid);
              setRevengeTargetUid("");
              setExecutionerBecomesJester(null);
            }}
            disabled={busy}
          />
        )}
      </div>

      <fieldset className="grid gap-2" disabled={busy || !targetUid || lockedTarget}>
        <legend className="text-xs font-semibold tracking-wide text-[#aaa49b] uppercase">
          Como morreu
        </legend>
        {DEATH_KIND_OPTIONS.map((option) => (
          <label
            key={option.id}
            className="flex gap-3 rounded-xl border border-white/10 p-3 text-sm text-[#e5ded2]"
          >
            <input
              type="radio"
              name="day-death-kind"
              className="mt-1 size-4 accent-[#7d2330]"
              checked={kind === option.id}
              onChange={() => {
                setKind(option.id);
                setExecutionerBecomesJester(null);
              }}
            />
            <span>
              <span className="block font-semibold text-[#fffaf0]">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[#aaa49b]">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {needsRevengeTarget && (
        <div className="grid gap-2">
          <span className="text-xs font-semibold tracking-wide text-[#f4dfbd] uppercase">
            Vingança do Jester
          </span>
          <p className="text-xs leading-5 text-[#aaa49b]">
            O Jester linchado leva alguém junto. Pergunte à mesa quem foi escolhido.
          </p>
          <NightTargetCombobox
            ariaLabel="Alvo da vingança do Jester"
            players={alivePlayers.filter(({ uid }) => uid !== targetUid)}
            assignments={assignments}
            value={revengeTargetUid}
            onChange={setRevengeTargetUid}
            disabled={busy}
          />
        </div>
      )}

      {pendingExecutioners.length > 0 && (
        <div className="grid gap-2 rounded-xl border border-amber-300/25 bg-amber-400/10 p-3">
          <p className="text-sm font-semibold text-amber-100">
            O alvo de um Executioner morreu sem ser linchado.
          </p>
          <p className="text-xs leading-5 text-amber-100/80">
            A regra não define este caso. Decida com a mesa o que acontece com
            {" "}
            {pendingExecutioners.map((uid) => playerNames[uid] ?? uid).join(", ")}.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setExecutionerBecomesJester(true)}
              className="min-h-10 rounded-xl border border-amber-300/40 px-3 text-sm font-bold text-amber-100"
            >
              Vira Jester
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setExecutionerBecomesJester(false)}
              className="min-h-10 rounded-xl border border-white/15 px-3 text-sm font-bold text-[#d8d2c8]"
            >
              Continua Executioner
            </button>
          </div>
        </div>
      )}

      {visibleWarnings.length > 0 && (
        <ul className="rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-xs text-red-200">
          {visibleWarnings.map((warning) => (
            <li key={warning.code}>{warning.message}</li>
          ))}
        </ul>
      )}

      {preview && (
        <div className="grid gap-2 rounded-xl border border-white/10 p-3">
          <span className="text-xs font-semibold tracking-wide text-[#aaa49b] uppercase">
            Efeitos
          </span>
          <ul className="grid gap-1 text-sm text-[#e5ded2]">
            {preview.deaths.map((death) => (
              <li key={`${death.targetUid}:${death.cause}`}>
                {playerNames[death.targetUid] ?? death.targetUid}
                {death.cause === "hanging" && " foi linchado."}
                {death.cause === "day-death" && " morreu durante o dia (sem linchamento)."}
                {death.cause === "jester-revenge" && " morreu pela vingança do Jester."}
              </li>
            ))}
            {preview.individualWinnerUids.map((uid) => (
              <li key={`winner:${uid}`} className="text-emerald-200">
                {playerNames[uid] ?? uid} venceu individualmente.
              </li>
            ))}
            {preview.roleChanges.map((change) => (
              <li key={`change:${change.playerUid}`} className="text-amber-100">
                {playerNames[change.playerUid] ?? change.playerUid}
                {` passa de ${change.fromRoleId} para ${change.toRoleId}.`}
              </li>
            ))}
            {preview.gameEnds && (
              <li className="font-semibold text-emerald-200">A partida termina com este resultado.</li>
            )}
          </ul>
        </div>
      )}

      <button
        type="button"
        disabled={busy || !targetUid || blocked}
        onClick={() => void apply()}
        className="min-h-11 rounded-xl bg-[#7d2330] px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#5d5552]"
      >
        Aplicar resultado do dia
      </button>
      <p role="status" className="min-h-5 text-sm text-[#bfe0c5]">{feedback}</p>
    </HostConsoleFrame>
  );
}
