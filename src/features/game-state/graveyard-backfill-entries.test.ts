import assert from "node:assert/strict";
import { test } from "node:test";

import type { PublicPlayerRecord } from "@/lib/firebase/schema";

import { getMissingGraveyardEntries } from "./graveyard-entry";

const player = (alive: boolean): PublicPlayerRecord => ({
  name: "Player",
  alive,
  disconnected: false,
  experience: "beginner",
});

test("buries dead players who never got a tombstone", () => {
  assert.deepEqual(
    getMissingGraveyardEntries(
      { dead: player(false), living: player(true) },
      { dead: { roleId: "doctor", faction: "town" } },
      {},
      99,
    ),
    { dead: { roleId: "doctor", cleaned: false, diedAt: 99 } },
  );
});

test("keeps a cleaned corpse anonymous when backfilling", () => {
  assert.deepEqual(
    getMissingGraveyardEntries(
      { dead: player(false) },
      { dead: { roleId: "doctor", faction: "town", statuses: { cleaned: { type: "cleaned" } } } },
      null,
      99,
    ),
    { dead: { cleaned: true, diedAt: 99 } },
  );
});

test("never rewrites a tombstone that already exists", () => {
  assert.deepEqual(
    getMissingGraveyardEntries(
      { dead: player(false) },
      { dead: { roleId: "doctor", faction: "town" } },
      { dead: { cleaned: true, diedAt: 1 } },
      99,
    ),
    {},
  );
});

test("leaves living players alone", () => {
  assert.deepEqual(
    getMissingGraveyardEntries({ living: player(true) }, {}, {}, 99),
    {},
  );
});
