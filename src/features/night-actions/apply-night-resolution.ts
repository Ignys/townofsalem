"use client";

import { createId } from "@/lib/utils/create-id";
import { runTransaction } from "firebase/database";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import {
  readGamePlayers,
  readGameGraveyard,
  readHostPrivatePlayers,
  readNightResolution,
  readNightSession,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate, type AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";
import { getDatabaseReference } from "@/lib/firebase/references";
import { omitUndefinedValues } from "@/lib/firebase/omit-undefined-values";
import { buildGraveyardEntry } from "@/features/game-state/graveyard-entry";
import type {
  DayAnnouncementRecord,
  NightResolutionRecord,
  NightSession,
  PlayerDawnNightResultRecord,
  PlayerStatus,
} from "@/types";
import { getRoleById } from "@/data/roles";

import { presentNightResolution } from "./night-resolution-presentation";
import { buildPlayerDawnNightResults } from "./player-night-results";
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
  const resolution = omitUndefinedValues(draft.resolution);
  const [game, players, privatePlayers, graveyard] = await Promise.all([
    readPublicGame(gameId),
    readGamePlayers(gameId),
    readHostPrivatePlayers(gameId),
    readGameGraveyard(gameId),
  ]);
  const revivedUids = (resolution.revivedUids ?? []).filter((uid) => players?.[uid]);
  if (!game || !players || game.currentNightId !== draft.nightId || game.status !== "in-progress") throw new Error("night-unavailable");

  const statusChanges = [
    ...(resolution.appliedStatuses ?? []).map(({ targetUid, statusType }) => ({
      targetUid,
      statusType,
    })),
    ...(resolution.removedStatuses ?? []),
  ];

  const record: NightResolutionRecord = {
    ...draft,
    resolution,
    playerAliveBefore: captureAliveBefore(players, [...resolution.deaths, ...revivedUids]),
    revivedGraveyardBefore: Object.fromEntries(
      revivedUids.flatMap((uid) => graveyard?.[uid] ? [[uid, graveyard[uid]]] : []),
    ),
    cleanStatusBefore: Object.fromEntries(resolution.cleanedPlayerUids.map((uid) => [uid, privatePlayers?.[uid]?.statuses?.cleaned ?? null])),
    appliedStatusBefore: Object.fromEntries(
      [...new Set(statusChanges.map(({ targetUid }) => targetUid))].map((targetUid) => [
        targetUid,
        Object.fromEntries(
          statusChanges
            .filter((status) => status.targetUid === targetUid)
            .map(({ statusType }) => [
              statusType,
              privatePlayers?.[targetUid]?.statuses?.[statusType] ?? null,
            ]),
        ),
      ]),
    ),
    roleStateBefore: Object.fromEntries(
      (resolution.roleChanges ?? []).flatMap(({ playerUid }) => {
        const current = privatePlayers?.[playerUid];
        return current
          ? [[playerUid, { roleId: current.roleId, faction: current.faction }]]
          : [];
      }),
    ),
    resourceUsesBefore: Object.fromEntries(
      (resolution.consumedResources ?? []).flatMap(({ playerUid }) => {
        const current = privatePlayers?.[playerUid];
        return current ? [[playerUid, current.resourceUses ?? {}]] : [];
      }),
    ),
    appliedAt: now,
  };
  const attemptId = createId();
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
    [firebasePaths.gameEvent(gameId, createId())]: {
      type: "NIGHT_RESOLUTION_APPLIED",
      timestamp: now,
      actorUid: hostUid,
      visibility: "host-only",
      payload: { nightId: draft.nightId, resolutionId: record.id },
    },
  };
  // O que cada jogador e a cidade descobrem ao amanhecer. As regras só liberam a leitura
  // quando a fase sai da noite, então aplicar ainda durante a noite não vaza nada.
  const playerNames = Object.fromEntries(
    Object.entries(players).map(([uid, player]) => [uid, player.name]),
  );
  const assignments = Object.fromEntries(
    Object.entries(privatePlayers ?? {}).map(([uid, privatePlayer]) => [uid, privatePlayer.roleId]),
  );
  const nightNumber = game.nightNumber ?? 0;
  for (const [uid, lines] of Object.entries(buildPlayerDawnNightResults(record.resolution, playerNames))) {
    if (!players[uid]) continue;
    updates[firebasePaths.gamePlayerDawnNightResult(gameId, uid, draft.nightId)] = {
      nightNumber,
      lines,
      createdAt: now,
    } satisfies PlayerDawnNightResultRecord;
  }
  updates[firebasePaths.gameDayAnnouncement(gameId, draft.nightId)] = {
    nightNumber,
    lines: presentNightResolution(record.resolution, playerNames, assignments).announcements,
    createdAt: now,
  } satisfies DayAnnouncementRecord;

  const cleanedUids = new Set(record.resolution.cleanedPlayerUids);
  const forgedRoles = new Map((record.resolution.forgedRoles ?? []).map(({ targetUid, roleId }) => [targetUid, roleId]));
  for (const uid of record.resolution.deaths) {
    if (!players[uid]) continue;
    const death = record.resolution.deathRecords?.find(({ targetUid }) => targetUid === uid);
    // O Bodyguard morre do ataque que interceptou: a lápide mostra esse ataque.
    const cause = (death?.cause === "bodyguard-sacrifice" ? death.originalAttackCause : death?.cause) ?? "night";
    const killerRoleId = cause === "night-attack" && death?.attackerUid
      ? privatePlayers?.[death.attackerUid]?.roleId
      : undefined;
    updates[firebasePaths.gamePlayerField(gameId, uid, "alive")] = false;
    updates[firebasePaths.gameGraveyardEntry(gameId, uid)] = buildGraveyardEntry(
      forgedRoles.get(uid) ?? privatePlayers?.[uid]?.roleId,
      cleanedUids.has(uid),
      now,
      {
        diedPhase: "night",
        diedNumber: nightNumber,
        cause,
        killerRoleId,
      },
    );
    updates[firebasePaths.gameEvent(gameId, createId())] = {
      type: "PLAYER_DIED", timestamp: now, actorUid: hostUid, visibility: "host-only", payload: { playerUid: uid, nightId: draft.nightId },
    };
  }
  for (const uid of revivedUids) {
    updates[firebasePaths.gamePlayerField(gameId, uid, "alive")] = true;
    updates[firebasePaths.gameGraveyardEntry(gameId, uid)] = null;
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
  for (const { targetUid, statusType } of record.resolution.removedStatuses ?? []) {
    updates[firebasePaths.gamePrivatePlayerStatus(gameId, targetUid, statusType)] = null;
  }
  for (const change of record.resolution.roleChanges ?? []) {
    const rememberedRole = getRoleById(change.toRoleId);
    if (!privatePlayers?.[change.playerUid] || !rememberedRole) continue;
    updates[firebasePaths.gamePrivatePlayerField(gameId, change.playerUid, "roleId")] = rememberedRole.id;
    updates[firebasePaths.gamePrivatePlayerField(gameId, change.playerUid, "faction")] = rememberedRole.faction;
  }
  for (const consumption of record.resolution.consumedResources ?? []) {
    const currentUses = privatePlayers?.[consumption.playerUid]?.resourceUses?.[consumption.resource] ?? 0;
    updates[firebasePaths.gamePrivatePlayerField(gameId, consumption.playerUid, "resourceUses")] = {
      ...(privatePlayers?.[consumption.playerUid]?.resourceUses ?? {}),
      [consumption.resource]: currentUses + consumption.amount,
    };
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
    [firebasePaths.gameEvent(gameId, createId())]: {
      type: "NIGHT_RESOLUTION_ROLLED_BACK", timestamp: now, actorUid: hostUid, visibility: "host-only", payload: { nightId, resolutionId: record.id },
    },
  };
  updates[firebasePaths.gameDayAnnouncement(gameId, nightId)] = null;
  for (const uid of Object.keys(buildPlayerDawnNightResults(record.resolution, {}))) {
    updates[firebasePaths.gamePlayerDawnNightResult(gameId, uid, nightId)] = null;
  }
  for (const [uid, alive] of Object.entries(record.playerAliveBefore ?? {})) {
    updates[firebasePaths.gamePlayerField(gameId, uid, "alive")] = alive;
    if (alive) {
      updates[firebasePaths.gameGraveyardEntry(gameId, uid)] = null;
    }
  }
  for (const [uid, entry] of Object.entries(record.revivedGraveyardBefore ?? {})) {
    updates[firebasePaths.gameGraveyardEntry(gameId, uid)] = entry;
  }
  for (const [uid, status] of Object.entries(record.cleanStatusBefore ?? {})) {
    updates[firebasePaths.gamePrivatePlayerStatus(gameId, uid, "cleaned")] = status;
  }
  for (const [uid, statuses] of Object.entries(record.appliedStatusBefore ?? {})) {
    for (const [statusType, status] of Object.entries(statuses)) {
      updates[firebasePaths.gamePrivatePlayerStatus(gameId, uid, statusType)] = status;
    }
  }
  for (const [uid, roleState] of Object.entries(record.roleStateBefore ?? {})) {
    updates[firebasePaths.gamePrivatePlayerField(gameId, uid, "roleId")] = roleState.roleId;
    updates[firebasePaths.gamePrivatePlayerField(gameId, uid, "faction")] = roleState.faction;
  }
  for (const [uid, resourceUses] of Object.entries(record.resourceUsesBefore ?? {})) {
    updates[firebasePaths.gamePrivatePlayerField(gameId, uid, "resourceUses")] = resourceUses;
  }
  await applyAtomicUpdate(updates);
}
