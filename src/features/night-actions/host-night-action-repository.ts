"use client";

import { runTransaction } from "firebase/database";

import { readNightSession, readPublicGame } from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import { getDatabaseReference } from "@/lib/firebase/references";
import type { HostNightActionEntry, HostNightNote, NightSession, NightWakeStatus } from "@/types";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";

async function requireEditableNight(gameId: string, nightId: string) {
  const [hostUid, game, session] = await Promise.all([
    requireAuthenticatedGameHost(gameId),
    readPublicGame(gameId),
    readNightSession(gameId, nightId),
  ]);

  if (!game || game.status !== "in-progress" || game.currentNightId !== nightId || !session) {
    throw new Error("night-unavailable");
  }
  if (session.resolutionAppliedAt && !session.rolledBackAt) {
    throw new Error("night-locked");
  }

  return { hostUid, session };
}

export async function saveHostNightAction(
  gameId: string,
  entry: HostNightActionEntry,
  wakeItemId?: string,
): Promise<void> {
  const { hostUid } = await requireEditableNight(gameId, entry.nightId);
  const sessionPath = firebasePaths.gameNightSession(gameId, entry.nightId);
  const pendingWriteId = crypto.randomUUID();
  const pendingResult = await runTransaction(
    getDatabaseReference(sessionPath),
    (current: NightSession | null) => {
      if (!current || current.resolutionApplyingId || (current.resolutionAppliedAt && !current.rolledBackAt)) return;
      return { ...current, pendingActionWrites: { ...(current.pendingActionWrites ?? {}), [pendingWriteId]: true } };
    },
    { applyLocally: false },
  );
  if (!pendingResult.committed) throw new Error("night-locked");

  try {
    await applyAtomicUpdate({
      [firebasePaths.gameHostNightAction(gameId, entry.nightId, entry.id)]: entry,
      ...(wakeItemId
        ? {
            [firebasePaths.gameNightWakeChecklistItem(gameId, entry.nightId, wakeItemId)]: {
              itemId: wakeItemId,
              status: "completed",
              updatedAt: entry.updatedAt,
            },
          }
        : {}),
      [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
        type: "HOST_ACTION_RECORDED",
        timestamp: entry.updatedAt,
        actorUid: hostUid,
        visibility: "host-only",
        payload: { nightId: entry.nightId, entryId: entry.id },
      },
    });
    const revisionResult = await runTransaction(
      getDatabaseReference(firebasePaths.gameNightSessionActionsRevision(gameId, entry.nightId)),
      (current: number | null) => (current ?? 0) + 1,
      { applyLocally: false },
    );
    if (!revisionResult.committed) throw new Error("revision-conflict");
  } finally {
    await applyAtomicUpdate({
      [firebasePaths.gameNightSessionPendingActionWrite(gameId, entry.nightId, pendingWriteId)]: null,
    });
  }
}

export async function cancelHostNightAction(
  gameId: string,
  entry: HostNightActionEntry,
  now: number,
): Promise<void> {
  await saveHostNightAction(gameId, { ...entry, status: "cancelled", updatedAt: now });
}

export async function setWakeChecklistStatus(
  gameId: string,
  nightId: string,
  itemId: string,
  status: NightWakeStatus,
  now: number = Date.now(),
): Promise<void> {
  await requireEditableNight(gameId, nightId);
  await applyAtomicUpdate({
    [firebasePaths.gameNightWakeChecklistItem(gameId, nightId, itemId)]: {
      itemId,
      status,
      updatedAt: now,
    },
  });
}

export async function saveHostNightNote(gameId: string, note: HostNightNote): Promise<void> {
  await requireEditableNight(gameId, note.nightId);
  await applyAtomicUpdate({
    [firebasePaths.gameHostNote(gameId, note.nightId, note.id)]: note,
  });
}

export async function deleteHostNightNote(gameId: string, note: HostNightNote): Promise<void> {
  await requireEditableNight(gameId, note.nightId);
  await applyAtomicUpdate({
    [firebasePaths.gameHostNote(gameId, note.nightId, note.id)]: null,
  });
}
