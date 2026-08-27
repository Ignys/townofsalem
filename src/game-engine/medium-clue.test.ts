import assert from "node:assert/strict";
import test from "node:test";

import { createMediumClue } from "./medium-clue";

test("Medium clues contain 2, 3 or 4 candidates and exactly one responsible player", () => {
  for (const candidateCount of [2, 3, 4] as const) {
    const clue = createMediumClue(
      "victim",
      "killer",
      ["victim", "killer", "a", "b", "c"],
      candidateCount,
      (_key, candidates) => [...candidates].sort()[0],
    );
    assert.equal(clue.candidateUids.length, candidateCount);
    assert.equal(clue.candidateUids.filter((uid) => uid === "killer").length, 1);
    assert.ok(!clue.candidateUids.includes("victim"));
  }
});
