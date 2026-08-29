import assert from "node:assert/strict";
import { test } from "node:test";

import type { GraveyardEntryRecord } from "@/lib/firebase/schema";

import { getRemainingRoleEntries } from "./remaining-roles";

const composition = { doctor: 1, townie: 2, mafioso: 1, janitor: 1 };

function counts(graveyard: Record<string, GraveyardEntryRecord>) {
  return Object.fromEntries(
    getRemainingRoleEntries(composition, graveyard).map(({ role, count }) => [role.id, count]),
  );
}

test("keeps every role while nobody has died", () => {
  assert.deepEqual(counts({}), composition);
});

test("removes the role of a revealed corpse", () => {
  assert.deepEqual(counts({ a: { roleId: "doctor", cleaned: false, diedAt: 1 } }), {
    townie: 2,
    mafioso: 1,
    janitor: 1,
  });
});

test("keeps the role of a corpse cleaned by the janitor", () => {
  assert.deepEqual(counts({ a: { cleaned: true, diedAt: 1 } }), composition);
});

test("decrements duplicated roles one corpse at a time", () => {
  assert.deepEqual(
    counts({
      a: { roleId: "townie", cleaned: false, diedAt: 1 },
      b: { roleId: "townie", cleaned: false, diedAt: 2 },
    }),
    { doctor: 1, mafioso: 1, janitor: 1 },
  );
});

test("never goes negative when a role change reveals a role outside the composition", () => {
  assert.deepEqual(counts({ a: { roleId: "jester", cleaned: false, diedAt: 1 } }), composition);
});
