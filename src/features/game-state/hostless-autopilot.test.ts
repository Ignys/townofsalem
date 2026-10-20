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
  assert.deepEqual(decideHostlessStep({ ...base, phase: "trial", accusedPlayerUid: "ana" }, "idle", alive, NOW), { kind: "start-timer", seconds: 30 });
  assert.deepEqual(decideHostlessStep({ ...base, phase: "verdict", accusedPlayerUid: "ana" }, "idle", alive, NOW), { kind: "start-timer", seconds: 30 });
});

test("a running or paused timer is left alone", () => {
  assert.equal(decideHostlessStep({ ...base, phase: "night" }, "running", alive, NOW), null);
  assert.equal(decideHostlessStep({ ...base, phase: "verdict", accusedPlayerUid: "ana" }, "paused", alive, NOW), null);
});

test("expired timers move the day along", () => {
  assert.deepEqual(decideHostlessStep({ ...base, phase: "night" }, "expired", alive, NOW), { kind: "end-night" });
  assert.equal(decideHostlessStep({ ...base, phase: "day" }, "idle", alive, NOW), null);
  assert.deepEqual(
    decideHostlessStep({ ...base, phase: "day" }, "running", alive, NOW, null, null, "relaxed", undefined, true),
    { kind: "start-discussion" },
  );
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

test("a lynched jester takes revenge during the following night", () => {
  const closed = { ...base, phase: "verdict" as const, accusedPlayerUid: "jess", verdictOutcome: "guilty" as const };
  const night = { ...base, phase: "night" as const };
  const dead = () => false;
  const pending = { jesterUid: "jess", targetUid: null };

  // O dia não espera a vingança: depois do resultado, a noite começa.
  assert.deepEqual(
    decideHostlessStep({ ...closed, verdictClosedAt: NOW - 10_000 }, "expired", dead, NOW, null, pending),
    { kind: "start-night" },
  );
  // Durante a noite, nada se resolve antes da hora.
  assert.equal(decideHostlessStep(night, "running", alive, NOW, null, pending), null);
  // Fim da noite: a vingança vem antes da resolução, com ou sem escolha.
  assert.deepEqual(
    decideHostlessStep(night, "expired", alive, NOW, null, { jesterUid: "jess", targetUid: "ana" }),
    { kind: "resolve-jester-revenge", jesterUid: "jess", targetUid: "ana" },
  );
  assert.deepEqual(
    decideHostlessStep(night, "expired", alive, NOW, null, pending),
    { kind: "resolve-jester-revenge", jesterUid: "jess", targetUid: null },
  );
});

test("each pace has its own timers", () => {
  const night = { ...base, phase: "night" as const };
  assert.deepEqual(decideHostlessStep(night, "idle", alive, NOW, null, null, "normal"), { kind: "start-timer", seconds: 60 });
  assert.deepEqual(decideHostlessStep(night, "idle", alive, NOW, null, null, "fast"), { kind: "start-timer", seconds: 60 });
  assert.deepEqual(decideHostlessStep(night, "idle", alive, NOW, null, null, "relaxed"), { kind: "start-timer", seconds: 90 });
});

test("fast track ends the night once everyone acted, and the vote once everyone voted", () => {
  const night = { ...base, phase: "night" as const };
  assert.deepEqual(
    decideHostlessStep(night, "running", alive, NOW, null, null, "fast", { nightComplete: true, allVerdictsIn: false }),
    { kind: "end-night" },
  );
  // Nos outros ritmos, a noite sempre vai até o fim do timer.
  assert.equal(
    decideHostlessStep(night, "running", alive, NOW, null, null, "normal", { nightComplete: true, allVerdictsIn: false }),
    null,
  );
  const verdict = { ...base, phase: "verdict" as const, accusedPlayerUid: "ana" };
  assert.deepEqual(
    decideHostlessStep(verdict, "running", alive, NOW, null, null, "fast", { nightComplete: false, allVerdictsIn: true }),
    { kind: "close-verdict" },
  );
});

test("every pace gives 30s of defense and 30s of voting", () => {
  const trial = { ...base, phase: "trial" as const, accusedPlayerUid: "ana" };
  const verdict = { ...trial, phase: "verdict" as const };
  for (const pace of ["relaxed", "normal", "fast"] as const) {
    assert.deepEqual(decideHostlessStep(trial, "idle", alive, NOW, null, null, pace), { kind: "start-timer", seconds: 30 });
    assert.deepEqual(decideHostlessStep(verdict, "idle", alive, NOW, null, null, pace), { kind: "start-timer", seconds: 30 });
  }
});

test("nothing happens outside a running game", () => {
  assert.equal(decideHostlessStep({ ...base, status: "finished", phase: "night" }, "expired", alive, NOW), null);
  assert.equal(decideHostlessStep({ ...base, status: "lobby", phase: "lobby" }, "idle", alive, NOW), null);
});

test("a win reached at night waits for the dawn and for everyone to be ready", () => {
  const winner = { gameOver: true, winningFactions: ["town"], winningPlayerUids: [] };
  const night = { ...base, phase: "night" as const };
  const dawn = { ...base, phase: "day" as const };

  // A noite segue até o fim, com a resolução e os anúncios.
  assert.deepEqual(decideHostlessStep(night, "expired", alive, NOW, winner), { kind: "end-night" });
  // Na preparação, ninguém vence enquanto falta alguém apertar "Pronto".
  assert.notEqual(
    decideHostlessStep(dawn, "idle", alive, NOW, winner, null, "relaxed", undefined, false)?.kind,
    "declare-winner",
  );
  assert.equal(
    decideHostlessStep(dawn, "idle", alive, NOW, winner, null, "relaxed", undefined, true)?.kind,
    "declare-winner",
  );
});
