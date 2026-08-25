import assert from "node:assert/strict";
import test from "node:test";

import { validateRoleComposition } from "./validate-role-composition";

test("accepts one valid, distinct role for each player", () => {
  const result = validateRoleComposition({
    roleIds: ["doctor", "sheriff"],
    playerCount: 2,
  });

  assert.deepEqual(result, { valid: true, errors: [] });
});

test("reports an empty composition and player count mismatch", () => {
  const result = validateRoleComposition({ roleIds: [], playerCount: 2 });

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.errors.map((error) => error.code),
    ["empty-composition", "player-count-mismatch"],
  );
});

test("reports when the number of roles differs from connected players", () => {
  const result = validateRoleComposition({
    roleIds: ["doctor"],
    playerCount: 2,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.code, "player-count-mismatch");
});

test("reports every unknown role id", () => {
  const result = validateRoleComposition({
    roleIds: ["invented-role"],
    playerCount: 1,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.code, "invalid-role-id");
});

test("rejects copies beyond the physical card count", () => {
  const result = validateRoleComposition({
    roleIds: ["doctor", "doctor"],
    playerCount: 2,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.code, "card-count-exceeded");
});

test("accepts duplicates that exist in the physical deck", () => {
  const result = validateRoleComposition({
    roleIds: ["townie", "townie"],
    playerCount: 2,
  });

  assert.deepEqual(result, { valid: true, errors: [] });
});

test("can explicitly forbid all duplicate ids", () => {
  const result = validateRoleComposition({
    roleIds: ["townie", "townie"],
    playerCount: 2,
    rules: { allowDuplicateRoleIds: false },
  });

  assert.equal(result.errors[0]?.code, "duplicate-role-not-allowed");
});
