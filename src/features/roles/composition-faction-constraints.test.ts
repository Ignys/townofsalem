import assert from "node:assert/strict";
import test from "node:test";

import { ROLE_DEFINITIONS } from "@/data/roles";

import { getFeasibleFactionCounts } from "./composition-faction-constraints";
import { getSuggestedFactionCounts } from "./suggested-faction-counts";

test("reserves factions for required roles while keeping the total", () => {
  const preferred = getSuggestedFactionCounts(4);
  assert.ok(preferred);

  assert.deepEqual(
    getFeasibleFactionCounts(
      4,
      preferred,
      ["investigator", "witch", "serial-killer", "godfather"],
      ROLE_DEFINITIONS,
    ),
    { town: 1, mafia: 1, neutral: 2 },
  );
});

test("rejects impossible required cards", () => {
  const preferred = getSuggestedFactionCounts(4);
  assert.ok(preferred);

  assert.equal(
    getFeasibleFactionCounts(
      4,
      preferred,
      ["investigator", "investigator"],
      ROLE_DEFINITIONS,
    ),
    null,
  );
});

test("fits the largest supported game inside physical faction capacities", () => {
  const preferred = getSuggestedFactionCounts(36);
  assert.ok(preferred);

  const result = getFeasibleFactionCounts(
    36,
    preferred,
    [],
    ROLE_DEFINITIONS,
  );

  assert.ok(result);
  assert.equal(result.town + result.mafia + result.neutral, 36);
});
