"use client";

import { useMemo, useState } from "react";

import { HostConsoleFrame } from "@/components/host/host-console-frame";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import { getPlayerDeathDetailsByUid } from "@/features/game-state/player-death-details";
import { HostPlayerDetailsModal } from "@/features/lobby/host-player-details-modal";
import type {
  HostNightActionEntry,
  NightResolutionRecord,
  NightSession,
  Player,
} from "@/types";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";

import { applyNightResolution, rollbackNightResolution } from "./apply-night-resolution";
import {
  calculateNightResolutionPreview,
  getNightResolutionPreviewEpoch,
} from "./calculate-night-resolution-preview";
import { presentNightResolution } from "./night-resolution-presentation";
import { NightResolutionSections } from "./night-resolution-sections";

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
  resolutionRecord?: NightResolutionRecord;
  resolutions?: Readonly<Record<string, NightResolutionRecord>>;
}

interface ErrorWithContext extends Error {
  operation?: unknown;
  path?: unknown;
  originalError?: unknown;
}

function getErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { receivedValue: error };
  }

  const contextualError = error as ErrorWithContext;

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: error.cause,
    operation: contextualError.operation,
    path: contextualError.path,
    originalError: contextualError.originalError,
  };
}

export function NightResolutionPreview({
  gameId,
  nightId,
  nightNumber,
  session,
  players,
  assignments,
  privatePlayers,
  entries,
  actionHistory,
  resolutionRecord,
  resolutions = {},
}: NightResolutionPreviewProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);
  const gameVariants = useGameVariants(gameId);
  const actionsRevision = session.actionsRevision ?? 0;
  const previewEpoch = getNightResolutionPreviewEpoch(
    session.startedAt,
    session.rolledBackAt,
    entries,
  );
  const { preview, validationIssues } = useMemo(
    () => calculateNightResolutionPreview({
      gameId,
      nightId,
      nightNumber,
      actionsRevision,
      previewEpoch,
      players,
      assignments,
      privatePlayers,
      entries,
      actionHistory,
      variants: gameVariants.variants,
      amnesiacRolePool: gameVariants.amnesiacRolePool,
      previousResolutions: resolutions,
    }),
    [
      actionHistory,
      actionsRevision,
      assignments,
      entries,
      gameId,
      gameVariants.amnesiacRolePool,
      gameVariants.variants,
      nightId,
      nightNumber,
      players,
      previewEpoch,
      privatePlayers,
      resolutions,
    ],
  );
  const playerNames = useMemo(() => Object.fromEntries(players.map(({ uid, name }) => [uid, name])), [players]);
  const applied = Boolean(session.resolutionAppliedAt && !session.rolledBackAt);
  const actionWritesPending = Object.keys(session.pendingActionWrites ?? {}).length > 0;
  const displayedResolution = applied
    && resolutionRecord
    && resolutionRecord.id === session.resolutionId
    && !resolutionRecord.rolledBackAt
    ? resolutionRecord.resolution
    : preview?.resolution;
  const presentation = displayedResolution
    ? presentNightResolution(displayedResolution, playerNames, assignments)
    : null;
  const deathDetailsByPlayer = useMemo(() => getPlayerDeathDetailsByUid({
    events: {},
    playerNames,
    resolutions,
  }), [playerNames, resolutions]);
  const nightNumberById = useMemo(
    () => ({ [nightId]: nightNumber }),
    [nightId, nightNumber],
  );

  const confirmPreview = async () => {
    if (!preview || preview.resolution.partial || actionWritesPending || busy) return;
    setBusy(true);
    setFeedback("");
    try {
      await applyNightResolution(gameId, { id: preview.id, nightId, actionsRevision: preview.actionsRevision, createdAt: preview.createdAt, resolution: preview.resolution });
      setFeedback("Resultado aplicado. A fase não foi alterada.");
    } catch (error: unknown) {
      console.error("[NightResolutionPreview] Falha ao aplicar o resultado da noite.", {
        error: getErrorDetails(error),
        gameId,
        nightId,
        previewId: preview.id,
        previewActionsRevision: preview.actionsRevision,
        currentActionsRevision: actionsRevision,
        resolution: preview.resolution,
      });
      setFeedback(
        error instanceof Error && error.message === "stale-preview"
          ? "O Action Log mudou. O preview será atualizado automaticamente."
          : "Não foi possível aplicar o resultado. Consulte o console para mais detalhes.",
      );
    } finally {
      setBusy(false);
    }
  };

  const rollback = async () => {
    if (busy || !window.confirm("Desfazer a última resolução e reabrir o Action Log?")) return;
    setBusy(true);
    try {
      await rollbackNightResolution(gameId, nightId);
      setFeedback("Resolução desfeita. O preview foi recalculado automaticamente.");
    } catch (error: unknown) {
      console.error("[NightResolutionPreview] Falha ao desfazer o resultado da noite.", {
        error: getErrorDetails(error),
        gameId,
        nightId,
        resolutionId: session.resolutionId,
      });
      setFeedback("Rollback inseguro: houve mudança posterior ou a resolução não é a mais recente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <HostConsoleFrame
        title="Resolução da noite"
        contentClassName="mt-3 grid gap-3"
        actions={<span className="text-xs font-semibold text-emerald-200">Preview automático</span>}
      >
        {!applied && validationIssues.length > 0 && <ul className="rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-xs text-red-200">{validationIssues.map((issue) => <li key={`${issue.entryId}:${issue.code}`}>{issue.entryId}: {issue.message}</li>)}</ul>}
        {!applied && !preview && validationIssues.length > 0 && <p role="status" className="text-sm text-amber-100">O preview será exibido assim que as ações inválidas forem corrigidas.</p>}
        {!applied && actionWritesPending && <p role="status" className="text-sm text-amber-100">Atualizando o preview com as ações mais recentes…</p>}
        {presentation && (
          <div className="grid gap-3">
            <NightResolutionSections
              presentation={presentation}
              onPlayerClick={setSelectedPlayerUid}
            />
            {!applied && preview && <button type="button" disabled={busy || actionWritesPending || preview.resolution.partial} onClick={() => void confirmPreview()} className="min-h-11 rounded-xl bg-[#7d2330] px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#5d5552]">Aplicar resultado</button>}
          </div>
        )}
        {applied && <button type="button" disabled={busy} onClick={() => void rollback()} className="min-h-10 rounded-xl border border-red-300/25 px-3 text-sm font-bold text-red-200 disabled:opacity-50">Desfazer última resolução</button>}
        <p role="status" className="mt-2 min-h-5 text-sm text-[#bfe0c5]">{feedback}</p>
      </HostConsoleFrame>
      <HostPlayerDetailsModal
        gameId={gameId}
        playerUid={selectedPlayerUid}
        players={players}
        privatePlayers={privatePlayers}
        actionHistory={actionHistory}
        actionHistoryLoaded
        nightNumberById={nightNumberById}
        playerNames={playerNames}
        deathDetailsByPlayer={deathDetailsByPlayer}
        onClose={() => setSelectedPlayerUid(null)}
      />
    </>
  );
}
