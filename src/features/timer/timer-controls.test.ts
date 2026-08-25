import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateTimerFieldUpdate,
  InvalidTimerCommandError,
} from "./timer-controls";

test("starts with one absolute end timestamp", () => {
  assert.deepEqual(
    calculateTimerFieldUpdate({}, { type: "start", durationMs: 60_000 }, 5_000),
    {
      phaseEndsAt: 65_000,
      timerPaused: false,
      timerRemainingMs: null,
    },
  );
});

test("pauses by persisting remaining duration", () => {
  assert.deepEqual(
    calculateTimerFieldUpdate(
      { phaseEndsAt: 65_000 },
      { type: "pause" },
      15_000,
    ),
    {
      phaseEndsAt: null,
      timerPaused: true,
      timerRemainingMs: 50_000,
    },
  );
});

test("resumes from the server-adjusted current time", () => {
  assert.deepEqual(
    calculateTimerFieldUpdate(
      { timerPaused: true, timerRemainingMs: 50_000 },
      { type: "resume" },
      20_000,
    ),
    {
      phaseEndsAt: 70_000,
      timerPaused: false,
      timerRemainingMs: null,
    },
  );
});

test("adds thirty seconds to running and paused timers", () => {
  assert.deepEqual(
    calculateTimerFieldUpdate(
      { phaseEndsAt: 65_000 },
      { type: "add-thirty-seconds" },
      15_000,
    ),
    {
      phaseEndsAt: 95_000,
      timerPaused: false,
      timerRemainingMs: null,
    },
  );
  assert.deepEqual(
    calculateTimerFieldUpdate(
      { timerPaused: true, timerRemainingMs: 10_000 },
      { type: "add-thirty-seconds" },
      15_000,
    ),
    {
      phaseEndsAt: null,
      timerPaused: true,
      timerRemainingMs: 40_000,
    },
  );
});

test("ends without advancing the phase", () => {
  assert.deepEqual(
    calculateTimerFieldUpdate(
      { phaseEndsAt: 65_000 },
      { type: "end" },
      15_000,
    ),
    {
      phaseEndsAt: null,
      timerPaused: false,
      timerRemainingMs: 0,
    },
  );
});

test("rejects commands that do not match the current timer state", () => {
  assert.throws(
    () => calculateTimerFieldUpdate({}, { type: "pause" }, 0),
    InvalidTimerCommandError,
  );
  assert.throws(
    () =>
      calculateTimerFieldUpdate(
        { phaseEndsAt: 10_000 },
        { type: "start", durationMs: 1_000 },
        0,
      ),
    InvalidTimerCommandError,
  );
});
