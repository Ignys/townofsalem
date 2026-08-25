import assert from "node:assert/strict";
import test from "node:test";

import {
  countAccusationVotes,
  getVotesRequired,
} from "./accusation-counting";

test("countAccusationVotes groups each voter's active target", () => {
  assert.deepEqual(
    countAccusationVotes({ voterA: "targetA", voterB: "targetA", voterC: "targetB" }),
    { targetA: 2, targetB: 1 },
  );
});

test("countAccusationVotes excludes voters who are no longer eligible", () => {
  assert.deepEqual(
    countAccusationVotes(
      { alive: "targetA", dead: "targetA" },
      new Set(["alive"]),
    ),
    { targetA: 1 },
  );
});

test("getVotesRequired uses a strict majority by default", () => {
  assert.equal(getVotesRequired(0, { thresholdMode: "strict-majority" }), 0);
  assert.equal(getVotesRequired(5, { thresholdMode: "strict-majority" }), 3);
  assert.equal(getVotesRequired(6, { thresholdMode: "strict-majority" }), 4);
});

test("getVotesRequired supports documented alternatives", () => {
  assert.equal(getVotesRequired(7, { thresholdMode: "two-thirds" }), 5);
  assert.equal(
    getVotesRequired(4, { thresholdMode: "fixed", fixedVotesRequired: 6 }),
    6,
  );
});

test("getVotesRequired rejects malformed player counts and fixed settings", () => {
  assert.throws(
    () => getVotesRequired(-1, { thresholdMode: "strict-majority" }),
    /non-negative integer/,
  );
  assert.throws(
    () => getVotesRequired(5, { thresholdMode: "fixed" }),
    /positive integer/,
  );
});
