import assert from "node:assert/strict";
import test from "node:test";

import { decideHostlessStep } from "./hostless-autopilot";

const alive = () => true;
const NOW = 1_000_000;
const base = {
  status: "in-progress" as const,
  accusedPlayerUid: null,
  verdictClosedAt: null,
  verdictOutcome: null,
};

test("every timed phase starts its timer as soon as it begins", () => {
  assert.deepEqual(decideHostlessStep({ ...base, phase: "night" }, "idle", alive, NOW), { kind: "start-timer", seconds: 90 });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "discussion" }, "idle", alive, NOW), { kind: "start-timer", seconds: 300 });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "trial", accusedPlayerUid: "ana" }, "idle", alive, NOW), { kind: "start-timer", seconds: 15 });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "verdict", accusedPlayerUid: "ana" }, "idle", alive, NOW), { kind: "start-timer", seconds: 60 });
});

test("a running or paused timer is left alone", () => {
  assert.equal(decideHostlessStep({ ...base, phase: "night" }, "running", alive, NOW), null);
  assert.equal(decideHostlessStep({ ...base, phase: "verdict", accusedPlayerUid: "ana" }, "paused", alive, NOW), null);
});

test("expired timers move the day along", () => {
  assert.deepEqual(decideHostlessStep({ ...base, phase: "night" }, "expired", alive, NOW), { kind: "end-night" });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "discussion" }, "expired", alive, NOW), { kind: "start-night" });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "trial", accusedPlayerUid: "ana" }, "expired", alive, NOW), { kind: "start-verdict" });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "verdict", accusedPlayerUid: "ana" }, "expired", alive, NOW), { kind: "close-verdict" });
});

test("a closed verdict lynches the guilty and then goes to night", () => {
  const closed = { ...base, phase: "verdict" as const, accusedPlayerUid: "ana", verdictClosedAt: NOW - 10_000 };
  assert.deepEqual(
    decideHostlessStep({ ...closed, verdictOutcome: "guilty" }, "expired", alive, NOW),
    { kind: "apply-lynch", targetUid: "ana" },
  );
  assert.deepEqual(
    decideHostlessStep({ ...closed, verdictOutcome: "guilty" }, "expired", () => false, NOW),
    { kind: "start-night" },
  );
  assert.deepEqual(
    decideHostlessStep({ ...closed, verdictOutcome: "innocent" }, "expired", alive, NOW),
    { kind: "start-night" },
  );
});

test("the verdict result stays on screen for a moment before night", () => {
  const justClosed = { ...base, phase: "verdict" as const, accusedPlayerUid: "ana", verdictClosedAt: NOW - 2_000, verdictOutcome: "innocent" as const };
  assert.equal(decideHostlessStep(justClosed, "expired", alive, NOW), null);
});

test("a win ends the game before anything else", () => {
  const winner = { gameOver: true, winningFactions: ["town"], winningPlayerUids: ["ana"] };
  assert.deepEqual(
    decideHostlessStep({ ...base, phase: "discussion" }, "running", alive, NOW, winner),
    { kind: "declare-winner", winningFactions: ["town"], winningPlayerUids: ["ana"] },
  );
  assert.deepEqual(
    decideHostlessStep({ ...base, phase: "night" }, "expired", alive, NOW, { ...winner, gameOver: false }),
    { kind: "end-night" },
  );
});

test("a lynch that wins the game still shows the vote result first", () => {
  const winner = { gameOver: true, winningFactions: ["town"], winningPlayerUids: ["ana"] };
  const closed = { ...base, phase: "verdict" as const, accusedPlayerUid: "caio", verdictOutcome: "guilty" as const };
  assert.deepEqual(
    decideHostlessStep({ ...closed, verdictClosedAt: NOW - 1_000 }, "expired", alive, NOW, winner),
    { kind: "apply-lynch", targetUid: "caio" },
  );
  assert.equal(decideHostlessStep({ ...closed, verdictClosedAt: NOW - 1_000 }, "expired", () => false, NOW, winner), null);
  assert.equal(
    decideHostlessStep({ ...closed, verdictClosedAt: NOW - 10_000 }, "expired", () => false, NOW, winner)?.kind,
    "declare-winner",
  );
});

test("nothing happens outside a running game", () => {
  assert.equal(decideHostlessStep({ ...base, status: "finished", phase: "night" }, "expired", alive, NOW), null);
  assert.equal(decideHostlessStep({ ...base, status: "lobby", phase: "lobby" }, "idle", alive, NOW), null);
});
