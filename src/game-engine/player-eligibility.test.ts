import assert from "node:assert/strict";
import test from "node:test";

import {
  isPlayerEligibleForNightAction,
  isPlayerEligibleToVote,
} from "./player-eligibility";

test("living players are eligible for voting and night actions", () => {
  assert.equal(isPlayerEligibleToVote({ alive: true }), true);
  assert.equal(isPlayerEligibleForNightAction({ alive: true }), true);
});

test("dead players are ineligible without losing their session", () => {
  assert.equal(isPlayerEligibleToVote({ alive: false }), false);
  assert.equal(isPlayerEligibleForNightAction({ alive: false }), false);
});
