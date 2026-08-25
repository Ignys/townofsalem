import assert from "node:assert/strict";
import test from "node:test";

import { deriveTimerState, formatTimerRemaining } from "./timer-state";

test("derives a running timer from an absolute end timestamp", () => {
  assert.deepEqual(
    deriveTimerState({ phaseEndsAt: 20_000 }, 5_000),
    { status: "running", remainingMs: 15_000 },
  );
});

test("emits expired without advancing the phase", () => {
  assert.deepEqual(
    deriveTimerState({ phaseEndsAt: 5_000 }, 5_001),
    { status: "expired", remainingMs: 0 },
  );
});

test("uses persisted remaining time while paused", () => {
  assert.deepEqual(
    deriveTimerState(
      {
        phaseEndsAt: null,
        timerPaused: true,
        timerRemainingMs: 42_000,
      },
      999_999,
    ),
    { status: "paused", remainingMs: 42_000 },
  );
});

test("distinguishes an ended timer from one that has not started", () => {
  assert.deepEqual(
    deriveTimerState({ timerPaused: false, timerRemainingMs: 0 }, 0),
    { status: "expired", remainingMs: 0 },
  );
  assert.deepEqual(
    deriveTimerState({ timerPaused: false, timerRemainingMs: null }, 0),
    { status: "idle", remainingMs: 0 },
  );
});

test("formats remaining time without writing per-second state", () => {
  assert.equal(formatTimerRemaining(0), "00:00");
  assert.equal(formatTimerRemaining(1), "00:01");
  assert.equal(formatTimerRemaining(61_000), "01:01");
  assert.equal(formatTimerRemaining(3_600_000), "60:00");
});
