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
