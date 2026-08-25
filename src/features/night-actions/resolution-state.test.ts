import assert from "node:assert/strict";
import test from "node:test";

import type { NightResolutionRecord, NightSession } from "@/types";

import {
  canRollbackResolution,
  getResolutionApplicationDecision,
  isResolutionClaimExpired,
  RESOLUTION_CLAIM_LEASE_MS,
} from "./resolution-state";

const session: NightSession = { id: "night", phaseSessionId: "phase", nightNumber: 1, startedAt: 1, actionsRevision: 2 };

test("rejects stale previews and treats the same resolution idempotently", () => {
  assert.equal(getResolutionApplicationDecision(session, "resolution", 1), "stale-preview");
  assert.equal(getResolutionApplicationDecision({ ...session, resolutionId: "resolution", resolutionAppliedAt: 3 }, "resolution", 2), "already-applied");
  assert.equal(getResolutionApplicationDecision({ ...session, resolutionId: "other", resolutionAppliedAt: 3 }, "resolution", 2), "locked");
});

test("rollback is only safe while the resolved phase session is still current", () => {
  const applied = { ...session, resolutionId: "resolution", resolutionAppliedAt: 3 };
  const record = { id: "resolution", nightId: "night", actionsRevision: 2, createdAt: 2, resolution: {} as never, playerAliveBefore: {}, cleanStatusBefore: {} } satisfies NightResolutionRecord;
  assert.equal(canRollbackResolution(applied, record, "phase"), true);
  assert.equal(canRollbackResolution(applied, record, "later-phase"), false);
});

test("a concurrent resolution claim can only be recovered after its lease", () => {
  const claimed: NightSession = { ...session, resolutionApplyingId: "attempt-a", resolutionApplyingAt: 1_000 };
  assert.equal(isResolutionClaimExpired(claimed, 1_000 + RESOLUTION_CLAIM_LEASE_MS - 1), false);
  assert.equal(isResolutionClaimExpired(claimed, 1_000 + RESOLUTION_CLAIM_LEASE_MS), true);
  assert.equal(isResolutionClaimExpired(session, Number.MAX_SAFE_INTEGER), false);
});
