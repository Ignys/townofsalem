import assert from "node:assert/strict";
import test from "node:test";

import {
  dayNumberForPhase,
  createPhaseSession,
  InvalidPhaseSessionError,
  MAX_PHASE_DURATION_SECONDS,
} from "./create-phase-session";

test("creates a timed phase from an absolute timestamp", () => {
  const result = createPhaseSession(
    { phaseSequenceNumber: 2, nightNumber: 1 },
    {
      phaseId: "discussion",
      label: "Discussão",
      durationSeconds: 90,
      startedAt: 1_000,
      phaseSessionId: "phase-3",
    },
  );

  assert.equal(result.phaseEndsAt, 91_000);
  assert.equal(result.phaseSession.sequenceNumber, 3);
  assert.equal(result.nextNightNumber, 1);
  assert.equal(result.nightSession, undefined);
});

test("each explicit night start receives stable identity and display number", () => {
  const result = createPhaseSession(
    { phaseSequenceNumber: 4, nightNumber: 2 },
    {
      phaseId: "night",
      label: "Noite",
      durationSeconds: 60,
      startedAt: 10_000,
      phaseSessionId: "phase-5",
      nightId: "night-stable-id",
    },
  );

  assert.equal(result.nightSession?.id, "night-stable-id");
  assert.equal(result.nightSession?.nightNumber, 3);
  assert.equal(result.phaseSession.nightId, "night-stable-id");
});

test("rejects zero and excessive custom durations", () => {
  for (const durationSeconds of [0, MAX_PHASE_DURATION_SECONDS + 1]) {
    assert.throws(
      () =>
        createPhaseSession({}, {
          phaseId: "custom",
          label: "Intervalo",
          durationSeconds,
          startedAt: 0,
          phaseSessionId: "phase",
        }),
      InvalidPhaseSessionError,
    );
  }
});

test("the day after night N is day N, and only a day start moves it", () => {
  assert.equal(dayNumberForPhase("discussion", 0, 3), 3);
  assert.equal(dayNumberForPhase("day", 2, 3), 3);
  assert.equal(dayNumberForPhase("discussion", 3, 3), 3);
  assert.equal(dayNumberForPhase("night", 2, 3), null);
  assert.equal(dayNumberForPhase("trial", 3, 3), null);
});
