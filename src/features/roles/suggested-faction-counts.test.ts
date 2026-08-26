import assert from "node:assert/strict";
import test from "node:test";

import { ROLE_DEFINITIONS } from "@/data/roles";

import { generateBalancedRoleComposition } from "./balanced-composition-generator";
import { getFeasibleFactionCounts } from "./composition-faction-constraints";
import {
  formatFactionCounts,
  getSuggestedFactionCounts,
} from "./suggested-faction-counts";

test("suggests the expected faction ratios for the supported presets", () => {
  assert.deepEqual(getSuggestedFactionCounts(10), {
    town: 6,
    mafia: 3,
    neutral: 1,
  });
  assert.deepEqual(getSuggestedFactionCounts(12), {
    town: 7,
    mafia: 3,
    neutral: 2,
  });
  assert.deepEqual(getSuggestedFactionCounts(15), {
    town: 9,
    mafia: 4,
    neutral: 2,
  });
});

test("rejects unsupported player counts and formats ratios by faction", () => {
  assert.equal(getSuggestedFactionCounts(3), null);
  assert.equal(getSuggestedFactionCounts(37), null);
  assert.equal(getSuggestedFactionCounts(10.5), null);
  assert.equal(
    formatFactionCounts({ town: 6, mafia: 3, neutral: 1 }),
    "6:3:1",
  );
});

test("generates the closest composition for every supported player count", () => {
  for (let playerCount = 4; playerCount <= 36; playerCount += 1) {
    const factionCounts = getSuggestedFactionCounts(playerCount);
    assert.ok(factionCounts);

    const feasibleFactionCounts = getFeasibleFactionCounts(
      playerCount,
      factionCounts,
      [],
      ROLE_DEFINITIONS,
    );
    assert.ok(feasibleFactionCounts);

    const result = generateBalancedRoleComposition(
      playerCount,
      feasibleFactionCounts,
      ROLE_DEFINITIONS,
    );

    assert.equal(result.ok, true);
    if (!result.ok) continue;
    assert.equal(result.roleIds.length, playerCount);
    assert.equal(Number.isFinite(result.virtueTotal), true);
    if (playerCount <= 27) assert.equal(result.virtueTotal, 0);
  }
});
