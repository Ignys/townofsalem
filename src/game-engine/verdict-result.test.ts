import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateVerdictResult,
  isPlayerEligibleForVerdict,
} from "./verdict-result";

test("calculateVerdictResult ignores abstentions in the guilty comparison", () => {
  const result = calculateVerdictResult(
    { a: "guilty", b: "innocent", c: "guilty", d: "abstain" },
    { accusedCanVote: false, tieBehavior: "no-decision" },
  );

  assert.deepEqual(result, {
    counts: { guilty: 2, innocent: 1, abstain: 1 },
    outcome: "guilty",
  });
});

test("ties produce no decision unless acquittal is configured", () => {
  const votes = { a: "guilty", b: "innocent" } as const;

  assert.equal(
    calculateVerdictResult(votes, {
      accusedCanVote: false,
      tieBehavior: "no-decision",
    }).outcome,
    "tie",
  );
  assert.equal(
    calculateVerdictResult(votes, {
      accusedCanVote: false,
      tieBehavior: "acquit",
    }).outcome,
    "innocent",
  );
});

test("the accused voter eligibility is configurable", () => {
  assert.equal(isPlayerEligibleForVerdict("accused", true, "accused", {
    accusedCanVote: false,
    tieBehavior: "no-decision",
  }), false);
  assert.equal(isPlayerEligibleForVerdict("accused", true, "accused", {
    accusedCanVote: true,
    tieBehavior: "no-decision",
  }), true);
  assert.equal(isPlayerEligibleForVerdict("dead", false, "accused", {
    accusedCanVote: true,
    tieBehavior: "no-decision",
  }), false);
});

test("the verdict result excludes votes from ineligible voters", () => {
  const result = calculateVerdictResult(
    { alive: "innocent", dead: "guilty", accused: "guilty" },
    { accusedCanVote: false, tieBehavior: "no-decision" },
    new Set(["alive"]),
  );

  assert.deepEqual(result, {
    counts: { guilty: 0, innocent: 1, abstain: 0 },
    outcome: "innocent",
  });
});
