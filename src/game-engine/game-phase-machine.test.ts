import assert from "node:assert/strict";
import test from "node:test";

import { GAME_PHASES, type GamePhase } from "@/types";

import {
  canTransition,
  getAllowedTransitions,
} from "./game-phase-machine";

const EXPECTED_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  lobby: ["day", "night", "game-over"],
  day: ["discussion", "game-over"],
  discussion: ["trial", "night", "game-over"],
  trial: ["defense", "game-over"],
  defense: ["verdict", "game-over"],
  verdict: ["discussion", "day", "night", "game-over"],
  night: ["day", "game-over"],
  custom: ["day", "discussion", "trial", "defense", "verdict", "night", "game-over"],
  "game-over": [],
};

test("returns the centralized allowed transitions for every phase", () => {
  GAME_PHASES.forEach((phase) => {
    assert.deepEqual(getAllowedTransitions(phase), EXPECTED_TRANSITIONS[phase]);
  });
});

test("allows each explicitly configured phase transition", () => {
  Object.entries(EXPECTED_TRANSITIONS).forEach(([from, transitions]) => {
    transitions.forEach((to) => {
      assert.equal(canTransition(from as GamePhase, to), true);
    });
  });
});

test("allows every active phase to end administratively", () => {
  GAME_PHASES.filter((phase) => phase !== "game-over").forEach((phase) => {
    assert.equal(canTransition(phase, "game-over"), true);
  });
});

test("treats game-over as a terminal phase", () => {
  assert.deepEqual(getAllowedTransitions("game-over"), []);

  GAME_PHASES.forEach((phase) => {
    assert.equal(canTransition("game-over", phase), false);
  });
});

test("rejects self transitions and transitions outside the configured flow", () => {
  GAME_PHASES.forEach((phase) => {
    assert.equal(canTransition(phase, phase), false);
  });

  assert.equal(canTransition("day", "night"), false);
  assert.equal(canTransition("trial", "verdict"), false);
  assert.equal(canTransition("night", "discussion"), false);
});

test("does not expose mutable transition arrays", () => {
  assert.equal(Object.isFrozen(getAllowedTransitions("discussion")), true);
});
