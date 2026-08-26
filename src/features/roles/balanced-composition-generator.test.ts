import assert from "node:assert/strict";
import test from "node:test";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { generateBalancedRoleComposition } from "./balanced-composition-generator";

test("finds the composition closest to zero while respecting faction slots", () => {
  const result = generateBalancedRoleComposition(
    3,
    { town: 1, mafia: 1, neutral: 1 },
    ROLE_DEFINITIONS,
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.roleIds.length, 3);
  assert.equal(result.virtueTotal, 0);
});

test("rejects mismatched totals and unavailable physical copies", () => {
  assert.deepEqual(
    generateBalancedRoleComposition(
      4,
      { town: 1, mafia: 1, neutral: 1 },
      ROLE_DEFINITIONS,
    ),
    { ok: false, code: "PLAYER_COUNT_MISMATCH" },
  );
  assert.deepEqual(
    generateBalancedRoleComposition(
      8,
      { town: 0, mafia: 0, neutral: 8 },
      ROLE_DEFINITIONS,
    ),
    { ok: false, code: "INSUFFICIENT_CARDS", faction: "neutral" },
  );
});

test("includes every required role and balances the remaining slots", () => {
  const requiredRoleIds = [
    "investigator",
    "witch",
    "serial-killer",
    "godfather",
  ];
  const result = generateBalancedRoleComposition(
    15,
    { town: 9, mafia: 4, neutral: 2 },
    ROLE_DEFINITIONS,
    requiredRoleIds,
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.roleIds.length, 15);
  for (const roleId of requiredRoleIds) {
    assert.ok(result.roleIds.includes(roleId));
  }
});

test("rejects required copies that do not exist in the physical deck", () => {
  assert.deepEqual(
    generateBalancedRoleComposition(
      4,
      { town: 2, mafia: 1, neutral: 1 },
      ROLE_DEFINITIONS,
      ["investigator", "investigator"],
    ),
    { ok: false, code: "INSUFFICIENT_CARDS", faction: "town" },
  );
});
