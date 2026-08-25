import assert from "node:assert/strict";
import test from "node:test";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { calculateRoleBalance } from "./balance-score";

test("sums the printed Virtue Values and reports the favored side", () => {
  const result = calculateRoleBalance(
    ["mayor", "godfather"],
    ROLE_DEFINITIONS,
  );

  assert.equal(result.total, 0);
  assert.equal(result.rating, "perfect");
  assert.equal(result.favoredSide, "none");
  assert.deepEqual(result.factionScores, { town: 8, mafia: -8, neutral: 0 });
});

test("classifies distance from zero and keeps unknown roles transparent", () => {
  const result = calculateRoleBalance(
    ["investigator", "invented-role"],
    ROLE_DEFINITIONS,
  );

  assert.equal(result.total, 6);
  assert.equal(result.rating, "moderate");
  assert.equal(result.favoredSide, "town");
  assert.equal(result.warnings.length, 1);
});
