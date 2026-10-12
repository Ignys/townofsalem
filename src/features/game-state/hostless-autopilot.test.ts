import assert from "node:assert/strict";
import test from "node:test";

import { decideHostlessStep } from "./hostless-autopilot";

const alive = () => true;
const base = {
  status: "in-progress" as const,
  accusedPlayerUid: null,
  verdictClosedAt: null,
  verdictOutcome: null,
};

test("every timed phase starts its timer as soon as it begins", () => {
  assert.deepEqual(decideHostlessStep({ ...base, phase: "night" }, "idle", alive), { kind: "start-timer", seconds: 90 });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "discussion" }, "idle", alive), { kind: "start-timer", seconds: 300 });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "trial", accusedPlayerUid: "ana" }, "idle", alive), { kind: "start-timer", seconds: 15 });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "verdict", accusedPlayerUid: "ana" }, "idle", alive), { kind: "start-timer", seconds: 60 });
});

test("a running or paused timer is left alone", () => {
  assert.equal(decideHostlessStep({ ...base, phase: "night" }, "running", alive), null);
  assert.equal(decideHostlessStep({ ...base, phase: "verdict", accusedPlayerUid: "ana" }, "paused", alive), null);
});

test("expired timers move the day along", () => {
  assert.deepEqual(decideHostlessStep({ ...base, phase: "night" }, "expired", alive), { kind: "end-night" });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "discussion" }, "expired", alive), { kind: "start-night" });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "trial", accusedPlayerUid: "ana" }, "expired", alive), { kind: "start-verdict" });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "verdict", accusedPlayerUid: "ana" }, "expired", alive), { kind: "close-verdict" });
});

test("a closed verdict lynches the guilty and then goes to night", () => {
  const closed = { ...base, phase: "verdict" as const, accusedPlayerUid: "ana", verdictClosedAt: 1 };
  assert.deepEqual(
    decideHostlessStep({ ...closed, verdictOutcome: "guilty" }, "expired", alive),
    { kind: "apply-lynch", targetUid: "ana" },
  );
  assert.deepEqual(
    decideHostlessStep({ ...closed, verdictOutcome: "guilty" }, "expired", () => false),
    { kind: "start-night" },
  );
  assert.deepEqual(
    decideHostlessStep({ ...closed, verdictOutcome: "innocent" }, "expired", alive),
    { kind: "start-night" },
  );
});

test("nothing happens outside a running game", () => {
  assert.equal(decideHostlessStep({ ...base, status: "finished", phase: "night" }, "expired", alive), null);
  assert.equal(decideHostlessStep({ ...base, status: "lobby", phase: "lobby" }, "idle", alive), null);
});
