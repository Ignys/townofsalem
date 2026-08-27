"use client";

import { useMemo, useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import { adaptHostActions, createEngineGameState } from "@/game-engine/host-action-adapter";
import { resolveNight } from "@/game-engine/resolve-night";
import type { NightResolution } from "@/game-engine/types";
import type { HostNightActionEntry, NightSession, Player } from "@/types";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";

import { applyNightResolution, rollbackNightResolution } from "./apply-night-resolution";
import { presentNightResolution } from "./night-resolution-presentation";
import { validateHostNightAction } from "./validate-host-night-action";

interface PreviewState {
  id: string;
  actionsRevision: number;
  createdAt: number;
  resolution: NightResolution;
}

interface NightResolutionPreviewProps {
  gameId: string;
  nightId: string;
  nightNumber: number;
  session: NightSession;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>>;
  entries: readonly HostNightActionEntry[];
  actionHistory: readonly HostNightActionEntry[];
}

export function NightResolutionPreview({ gameId, nightId, nightNumber, session, players, assignments, privatePlayers, entries, actionHistory }: NightResolutionPreviewProps) {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const gameVariants = useGameVariants(gameId);
  const confirmedEntries = entries.filter(({ status }) => status === "confirmed");
  const validationContext = {
    players,
    assignments,
    roleDefinitions: ROLE_DEFINITIONS,
    nightId,
    nightNumber,
    actionEntries: actionHistory,
    variants: gameVariants.variants,
  };
  const validationIssues = confirmedEntries.flatMap((entry) => validateHostNightAction(entry, validationContext).map((issue) => ({ ...issue, entryId: entry.id })));
  const playerNames = useMemo(() => Object.fromEntries(players.map(({ uid, name }) => [uid, name])), [players]);
  const stale = Boolean(preview && preview.actionsRevision !== (session.actionsRevision ?? 0));
  const presentation = preview ? presentNightResolution(preview.resolution, playerNames) : null;
  const applied = Boolean(session.resolutionAppliedAt && !session.rolledBackAt);

  const generatePreview = () => {
    setFeedback("");
    if (validationIssues.some(({ severity }) => severity === "error")) {
      setFeedback("Corrija as ações inválidas antes de gerar o preview.");
      return;
    }
    const adapted = adaptHostActions(confirmedEntries, ROLE_DEFINITIONS);
    const engineState = createEngineGameState({
      gameId,
      nightId,
      nightNumber,
      players,
      assignments,
      privatePlayerStates: privatePlayers,
      roleDefinitions: ROLE_DEFINITIONS,
      variants: gameVariants.variants,
      amnesiacRolePool: gameVariants.amnesiacRolePool,
    });
    const resolution = resolveNight(engineState, adapted.actions);
    setPreview({
      id: crypto.randomUUID(),
      actionsRevision: session.actionsRevision ?? 0,
      createdAt: Date.now(),
      resolution: { ...resolution, warnings: [...adapted.warnings, ...resolution.warnings], partial: resolution.partial || adapted.warnings.length > 0 },
    });
  };

  const confirmPreview = async () => {
    if (!preview || stale || preview.resolution.partial || busy) return;
    setBusy(true);
    setFeedback("");
    try {
      await applyNightResolution(gameId, { id: preview.id, nightId, actionsRevision: preview.actionsRevision, createdAt: preview.createdAt, resolution: preview.resolution });
      setFeedback("Resultado aplicado. A fase não foi alterada.");
    } catch (error: unknown) {
      setFeedback(error instanceof Error && error.message === "stale-preview" ? "O Action Log mudou. Gere um novo preview." : "Não foi possível aplicar o resultado.");
    } finally {
      setBusy(false);
    }
  };

  const rollback = async () => {
    if (busy || !window.confirm("Desfazer a última resolução e reabrir o Action Log?")) return;
    setBusy(true);
    try {
      await rollbackNightResolution(gameId, nightId);
      setPreview(null);
      setFeedback("Resolução desfeita. Gere um novo preview após corrigir o log.");
    } catch {
      setFeedback("Rollback inseguro: houve mudança posterior ou a resolução não é a mais recente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-[#6f9b77]/25 bg-[#6f9b77]/[0.05] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-[#fffaf0]">Resolução da noite</h3>
        <button type="button" disabled={busy || applied} onClick={generatePreview} className="min-h-10 rounded-xl border border-[#6f9b77]/35 px-3 text-sm font-bold text-[#bfe0c5] disabled:opacity-50">Pré-visualizar resultado da noite</button>
      </div>
      {validationIssues.length > 0 && <ul className="mt-3 rounded-xl bg-black/20 p-3 text-xs text-[#f0b9bd]">{validationIssues.map((issue) => <li key={`${issue.entryId}:${issue.code}`}>{issue.entryId}: {issue.message}</li>)}</ul>}
      {presentation && preview && (
        <div className="mt-4 grid gap-3">
          <div className="rounded-xl bg-black/20 p-3">
            <h4 className="text-xs font-bold tracking-wide text-[#d3b88c] uppercase">Resumo</h4>
            <ul className="mt-2 grid gap-1 text-sm">{presentation.summary.map((line) => <li key={line}>{line}</li>)}</ul>
          </div>
          {(presentation.warnings.length > 0 || stale) && <div role="alert" className="rounded-xl border border-[#a33843]/35 bg-[#a33843]/10 p-3 text-sm text-[#f0b9bd]">{stale && <p>Preview desatualizado: o Action Log mudou.</p>}{presentation.warnings.map((line) => <p key={line}>{line}</p>)}</div>}
          <details className="rounded-xl border border-white/10 p-3"><summary className="cursor-pointer font-semibold">Por que isso aconteceu?</summary><ul className="mt-2 grid gap-1 text-xs text-[#bdb7ad]">{presentation.details.map((line, index) => <li key={`${index}:${line}`}>{line}</li>)}</ul></details>
          {!applied && <button type="button" disabled={busy || stale || preview.resolution.partial} onClick={() => void confirmPreview()} className="min-h-11 rounded-xl bg-[#7d2330] px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#5d5552]">Confirmar resultado</button>}
        </div>
      )}
      {applied && <button type="button" disabled={busy} onClick={() => void rollback()} className="mt-4 min-h-10 rounded-xl border border-[#a33843]/35 px-3 text-sm font-bold text-[#f0b9bd] disabled:opacity-50">Desfazer última resolução</button>}
      <p role="status" className="mt-2 min-h-5 text-sm text-[#bfe0c5]">{feedback}</p>
    </section>
  );
}
