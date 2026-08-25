import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { NightResolutionRecord, NightSession } from "@/types";

export type ResolutionApplicationDecision = "apply" | "already-applied" | "stale-preview" | "locked";

export const RESOLUTION_CLAIM_LEASE_MS = 30_000;

export function isResolutionClaimExpired(session: NightSession, now: number): boolean {
  return Boolean(
    session.resolutionApplyingId
    && session.resolutionApplyingAt
    && now - session.resolutionApplyingAt >= RESOLUTION_CLAIM_LEASE_MS,
  );
}

export function getResolutionApplicationDecision(
  session: NightSession,
  resolutionId: string,
  actionsRevision: number,
): ResolutionApplicationDecision {
  if (session.resolutionId === resolutionId && session.resolutionAppliedAt) return "already-applied";
  if (session.resolutionAppliedAt && !session.rolledBackAt) return "locked";
  if ((session.actionsRevision ?? 0) !== actionsRevision) return "stale-preview";
  return "apply";
}

export function captureAliveBefore(
  players: Readonly<Record<string, PublicPlayerRecord>>,
  deaths: readonly string[],
): Readonly<Record<string, boolean>> {
  return Object.fromEntries(deaths.flatMap((uid) => players[uid] ? [[uid, players[uid].alive]] : []));
}

export function canRollbackResolution(
  session: NightSession,
  record: NightResolutionRecord,
  currentPhaseSessionId: string | null | undefined,
): boolean {
  return Boolean(
    session.resolutionAppliedAt &&
    !session.rolledBackAt &&
    session.resolutionId === record.id &&
    session.phaseSessionId === currentPhaseSessionId,
  );
}
