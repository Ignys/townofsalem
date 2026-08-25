"use client";

import { runTransaction } from "firebase/database";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import {
  readGamePlayers,
  readHostPrivatePlayers,
  readNightResolution,
  readNightSession,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate, type AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";
import { getDatabaseReference } from "@/lib/firebase/references";
import type { NightResolutionRecord, NightSession, PlayerStatus } from "@/types";

import { canRollbackResolution, captureAliveBefore, getResolutionApplicationDecision, isResolutionClaimExpired } from "./resolution-state";

async function claimResolution(
  gameId: string,
  record: NightResolutionRecord,
  attemptId: string,
  now: number,
): Promise<"claimed" | "already-applied"> {
  const decision: { value: ReturnType<typeof getResolutionApplicationDecision> } = { value: "locked" };
  const transaction = await runTransaction(
    getDatabaseReference(firebasePaths.gameNightSession(gameId, record.nightId)),
    (current: NightSession | null) => {
      if (!current) return;
      if (current.pendingActionWrites && Object.keys(current.pendingActionWrites).length > 0) {
        decision.value = "stale-preview";
        return;
      }
      decision.value = getResolutionApplicationDecision(current, record.id, record.actionsRevision);
      if (decision.value === "already-applied") return current;
      if (decision.value !== "apply") return;
      if (current.resolutionApplyingId && !isResolutionClaimExpired(current, now)) {
        decision.value = "locked";
        return;
      }
      return { ...current, resolutionApplyingId: attemptId, resolutionApplyingAt: now };
    },
    { applyLocally: false },
  );

  if (decision.value === "already-applied") return "already-applied";
  if (!transaction.committed) throw new Error(decision.value);
  return "claimed";
}

export async function applyNightResolution(
  gameId: string,
  draft: Omit<NightResolutionRecord, "playerAliveBefore" | "cleanStatusBefore" | "appliedAt">,
  now: number = Date.now(),
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const [game, players, privatePlayers] = await Promise.all([
    readPublicGame(gameId),
    readGamePlayers(gameId),
    readHostPrivatePlayers(gameId),
  ]);
  if (!game || !players || game.currentNightId !== draft.nightId || game.status !== "in-progress") throw new Error("night-unavailable");

  const record: NightResolutionRecord = {
    ...draft,
    playerAliveBefore: captureAliveBefore(players, draft.resolution.deaths),
    cleanStatusBefore: Object.fromEntries(draft.resolution.cleanedPlayerUids.map((uid) => [uid, privatePlayers?.[uid]?.statuses?.cleaned ?? null])),
    appliedStatusBefore: Object.fromEntries(
      (draft.resolution.appliedStatuses ?? []).map(({ targetUid }) => [
        targetUid,
        Object.fromEntries(
          (draft.resolution.appliedStatuses ?? [])
            .filter((status) => status.targetUid === targetUid)
            .map(({ statusType }) => [
              statusType,
              privatePlayers?.[targetUid]?.statuses?.[statusType] ?? null,
            ]),
        ),
      ]),
    ),
    appliedAt: now,
  };
  const attemptId = crypto.randomUUID();
  if ((await claimResolution(gameId, record, attemptId, now)) === "already-applied") return;

  const session = await readNightSession(gameId, draft.nightId);
  if (!session || session.resolutionApplyingId !== attemptId) throw new Error("resolution-claim-lost");

  const updates: AtomicUpdateMap = {
    [firebasePaths.gameNightSession(gameId, draft.nightId)]: {
      ...session,
      resolutionId: record.id,
      resolutionAppliedAt: now,
      rolledBackAt: null,
      resolutionApplyingId: null,
      resolutionApplyingAt: null,
    },
    [firebasePaths.gameNightResolution(gameId, draft.nightId)]: record,
    [firebasePaths.gameNightResolutionVersion(gameId, draft.nightId, record.id)]: record,
    [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
      type: "NIGHT_RESOLUTION_APPLIED",
      timestamp: now,
      actorUid: hostUid,
      visibility: "host-only",
      payload: { nightId: draft.nightId, resolutionId: record.id },
    },
  };
  for (const uid of record.resolution.deaths) {
    if (!players[uid]) continue;
    updates[firebasePaths.gamePlayerField(gameId, uid, "alive")] = false;
    updates[firebasePaths.gameEvent(gameId, crypto.randomUUID())] = {
      type: "PLAYER_DIED", timestamp: now, actorUid: hostUid, visibility: "host-only", payload: { playerUid: uid, nightId: draft.nightId },
    };
  }
  for (const uid of record.resolution.cleanedPlayerUids) {
    if (!privatePlayers?.[uid]) continue;
    const cleanStatus: PlayerStatus = { type: "cleaned" };
    updates[firebasePaths.gamePrivatePlayerStatus(gameId, uid, "cleaned")] = cleanStatus;
  }
  for (const { targetUid, statusType } of record.resolution.appliedStatuses ?? []) {
    if (!privatePlayers?.[targetUid]) continue;
    updates[firebasePaths.gamePrivatePlayerStatus(gameId, targetUid, statusType)] = {
      type: statusType,
    } satisfies PlayerStatus;
  }
  await applyAtomicUpdate(updates);
}

export async function rollbackNightResolution(gameId: string, nightId: string, now: number = Date.now()): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const [game, session, record] = await Promise.all([
    readPublicGame(gameId),
    readNightSession(gameId, nightId),
    readNightResolution(gameId, nightId),
  ]);
  if (!game || !session || !record || !canRollbackResolution(session, record, game.phaseSessionId)) throw new Error("unsafe-rollback");

  const updates: AtomicUpdateMap = {
    [firebasePaths.gameNightSession(gameId, nightId)]: {
      ...session,
      resolutionId: null,
      resolutionAppliedAt: null,
      rolledBackAt: now,
      resolutionApplyingId: null,
      resolutionApplyingAt: null,
    },
    [firebasePaths.gameNightResolution(gameId, nightId)]: { ...record, rolledBackAt: now },
    [firebasePaths.gameNightResolutionVersion(gameId, nightId, record.id)]: { ...record, rolledBackAt: now },
    [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
      type: "NIGHT_RESOLUTION_ROLLED_BACK", timestamp: now, actorUid: hostUid, visibility: "host-only", payload: { nightId, resolutionId: record.id },
    },
  };
  for (const [uid, alive] of Object.entries(record.playerAliveBefore ?? {})) {
    updates[firebasePaths.gamePlayerField(gameId, uid, "alive")] = alive;
  }
  for (const [uid, status] of Object.entries(record.cleanStatusBefore ?? {})) {
    updates[firebasePaths.gamePrivatePlayerStatus(gameId, uid, "cleaned")] = status;
  }
  for (const [uid, statuses] of Object.entries(record.appliedStatusBefore ?? {})) {
    for (const [statusType, status] of Object.entries(statuses)) {
      updates[firebasePaths.gamePrivatePlayerStatus(gameId, uid, statusType)] = status;
    }
  }
  await applyAtomicUpdate(updates);
}
