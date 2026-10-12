"use client";

import { useRef, useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { saveHostNightAction } from "@/features/night-actions/host-night-action-repository";
import {
  hasBlockingHostActionIssues,
  validateHostNightAction,
} from "@/features/night-actions/validate-host-night-action";
import { currentTimestamp } from "@/lib/utils/timestamp";
import type { HostNightActionEntry, Player } from "@/types";
import type { GameVariants } from "@/game-engine/variants";

import type { NightConsoleInteraction } from "./night-console-interactions";

interface UseHostNightConsoleActionOptions {
  gameId: string;
  nightId: string;
  nightNumber: number;
  interaction: NightConsoleInteraction;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  existingEntry?: HostNightActionEntry;
  actionHistory: readonly HostNightActionEntry[];
  locked: boolean;
  variants: GameVariants;
}

export function useHostNightConsoleAction({
  gameId,
  nightId,
  nightNumber,
  interaction,
  players,
  assignments,
  existingEntry,
  actionHistory,
  locked,
  variants,
}: UseHostNightConsoleActionOptions) {
  const [selectedTargetUids, setSelectedTargetUids] = useState<readonly string[]>(
    existingEntry?.targetUids ?? [],
  );
  const [noTargetActionRecorded, setNoTargetActionRecorded] = useState(
    existingEntry?.status === "confirmed",
  );
  const entryIdRef = useRef(existingEntry?.id);
  const createdAtRef = useRef(existingEntry?.createdAt);
  const saveQueueRef = useRef(Promise.resolve());

  const persist = (targetUids: readonly string[]) => {
    if (locked) return;

    const timestamp = currentTimestamp();
    const entryId = existingEntry?.id ?? entryIdRef.current ?? crypto.randomUUID();
    const createdAt = existingEntry?.createdAt ?? createdAtRef.current ?? timestamp;
    const candidate: HostNightActionEntry = {
      id: entryId,
      nightId,
      nightNumber,
      actorUid: interaction.actor.uid,
      roleIdSnapshot: interaction.role.id,
      actionId: interaction.action.id,
      targetUids,
      createdAt,
      updatedAt: timestamp,
      status: "confirmed",
      // Uma edição do mestre assume a entrada: o espelhamento só volta a
      // sobrescrevê-la se o jogador enviar algo mais novo que este momento.
      ...(existingEntry?.source === "player"
        ? { source: "host" as const, overriddenAt: timestamp }
        : {}),
    };
    const issues = validateHostNightAction(candidate, {
      players,
      assignments,
      roleDefinitions: ROLE_DEFINITIONS,
      nightId,
      nightNumber,
      actionEntries: actionHistory,
      variants,
    });

    const confirmed = !hasBlockingHostActionIssues(issues);
    const entry: HostNightActionEntry = {
      ...candidate,
      status: confirmed ? "confirmed" : "draft",
    };

    entryIdRef.current = entryId;
    createdAtRef.current = createdAt;
    if (interaction.action.targetCount === 0 && confirmed) {
      setNoTargetActionRecorded(true);
    }
    const wakeItemId = !confirmed || interaction.role.wakeGroupId
      ? undefined
      : `player:${interaction.actor.uid}`;

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveHostNightAction(gameId, entry, wakeItemId))
      .catch(() => undefined);
  };

  const setTarget = (targetIndex: number, playerUid: string) => {
    const nextTargets = Array.from(
      { length: interaction.action.targetCount },
      (_, index) =>
        index === targetIndex ? playerUid : selectedTargetUids[index] ?? "",
    );

    setSelectedTargetUids(nextTargets);
    persist(nextTargets);
  };

  return {
    selectedTargetUids,
    setTarget,
    noTargetActionRecorded,
    recordNoTargetAction: () => persist([]),
  };
}
