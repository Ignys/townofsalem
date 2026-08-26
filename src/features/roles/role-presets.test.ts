import assert from "node:assert/strict";
import test from "node:test";

import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";

import { calculateRoleBalance } from "./balance-score";
import { ROLE_COMPOSITION_PRESETS } from "./role-presets";
import { validateRoleComposition } from "./validate-role-composition";

test("ships balanced presets for 10, 12 and 15 players", () => {
  assert.deepEqual(
    ROLE_COMPOSITION_PRESETS.map((preset) => preset.playerCount),
    [10, 12, 15],
  );

  for (const preset of ROLE_COMPOSITION_PRESETS) {
    const actualFactionCounts = { town: 0, mafia: 0, neutral: 0 };

    for (const roleId of preset.roleIds) {
      const role = getRoleById(roleId);
      assert.ok(role, `Unknown role in ${preset.id}: ${roleId}`);
      actualFactionCounts[role.faction] += 1;
    }

    assert.equal(preset.roleIds.length, preset.playerCount);
    assert.deepEqual(actualFactionCounts, preset.factionCounts);
    assert.equal(
      validateRoleComposition({
        roleIds: preset.roleIds,
        playerCount: preset.playerCount,
      }).valid,
      true,
    );
    assert.equal(
      calculateRoleBalance(preset.roleIds, ROLE_DEFINITIONS).total,
      0,
    );
  }
});
