"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import type { NightConsoleInteraction } from "@/features/lobby/night-console-interactions";
import type { GameVariants } from "@/game-engine/variants";
import { observeHostPlayerNightActions } from "@/lib/firebase/realtime-database-repository";
import { currentTimestamp } from "@/lib/utils/timestamp";
import type { HostNightActionEntry, Player, PlayerNightActionSubmission } from "@/types";

import { saveHostNightAction } from "./host-night-action-repository";
import { buildMirrorPlan, type PlayerSubmissionRecord } from "./mirror-player-night-action";

interface UseHostPlayerNightActionMirrorOptions {
  gameId: string;
  nightId: string;
  nightNumber: number;
  hostUid: string;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  interactions: readonly NightConsoleInteraction[];
  entries: readonly HostNightActionEntry[];
  actionHistory: readonly HostNightActionEntry[];
  locked: boolean;
  variants: GameVariants;
}

/**
 * Espelha as submissões dos jogadores para `hostNightActions`.
 *
 * Roda no cliente do mestre porque só ele pode escrever ali — e escrever via
 * `saveHostNightAction` preserva o lock de escrita pendente, o bump de `actionsRevision`,
 * o evento `HOST_ACTION_RECORDED` e a marcação do checklist de despertar.
 */
export function useHostPlayerNightActionMirror({
  gameId,
  nightId,
  nightNumber,
  hostUid,
  players,
  assignments,
  interactions,
  entries,
  actionHistory,
  locked,
  variants,
}: UseHostPlayerNightActionMirrorOptions) {
  const [submissions, setSubmissions] = useState<
    Record<string, Record<string, PlayerNightActionSubmission>>
  >({});
  const [error, setError] = useState(false);
  const saveQueueRef = useRef(Promise.resolve());
  // O que já foi escrito nesta sessão: as entradas observadas atrasam um round-trip.
  const writtenRef = useRef(new Map<string, number>());

  useEffect(() => {
    writtenRef.current.clear();
    return observeHostPlayerNightActions(gameId, nightId, hostUid, {
      onData: (value) => {
        setSubmissions(value ?? {});
        setError(false);
      },
      onError: () => setError(true),
    });
  }, [gameId, hostUid, nightId]);

  const records = useMemo<PlayerSubmissionRecord[]>(
    () =>
      Object.entries(submissions).flatMap(([actorUid, byAction]) =>
        Object.values(byAction ?? {}).map((submission) => ({ actorUid, submission })),
      ),
    [submissions],
  );

  const plan = useMemo(
    () =>
      buildMirrorPlan(records, interactions, entries, {
        players,
        assignments,
        roleDefinitions: ROLE_DEFINITIONS,
        nightId,
        nightNumber,
        actionEntries: actionHistory,
        variants,
      }, currentTimestamp()),
    [actionHistory, assignments, entries, interactions, nightId, nightNumber, players, records, variants],
  );

  const flush = useCallback(() => {
    if (locked) return;

    // O filtro vive aqui (e não em um useMemo) porque `writtenRef` não pode ser lido
    // durante a renderização; as entradas observadas atrasam um round-trip.
    const pending = plan.entries.filter(
      (entry) => writtenRef.current.get(entry.id) !== entry.sourceUpdatedAt,
    );

    for (const entry of pending) {
      writtenRef.current.set(entry.id, entry.sourceUpdatedAt ?? 0);
      const interaction = interactions.find(
        ({ actor, action }) => actor.uid === entry.actorUid && action.id === entry.actionId,
      );
      const wakeItemId =
        entry.status !== "confirmed" || interaction?.role.wakeGroupId
          ? undefined
          : `player:${entry.actorUid}`;

      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(() => saveHostNightAction(gameId, entry, wakeItemId))
        .catch(() => {
          // `night-locked` é esperado se o mestre resolveu a noite no meio do caminho.
          writtenRef.current.delete(entry.id);
        });
    }
  }, [gameId, interactions, locked, plan.entries]);

  useEffect(() => {
    flush();
  }, [flush]);

  return {
    error,
    // `plan.entries` já exclui o que foi espelhado; sobra o que ainda não entrou.
    pendingCount: locked ? 0 : plan.entries.length,
    invalidCount: plan.skipped.filter(({ reason }) => reason === "no-matching-interaction").length,
    sync: flush,
  };
}
