import assert from "node:assert/strict";
import { test } from "node:test";

import { buildGraveyardEntry } from "./graveyard-entry";

test("records the role of a body nobody cleaned", () => {
  assert.deepEqual(buildGraveyardEntry("doctor", false, 10), {
    roleId: "doctor",
    cleaned: false,
    diedAt: 10,
  });
});

test("omits the role of a cleaned body", () => {
  assert.deepEqual(buildGraveyardEntry("doctor", true, 10), { cleaned: true, diedAt: 10 });
});

test("treats a missing role as cleaned so the grave never leaks an empty role", () => {
  assert.deepEqual(buildGraveyardEntry(undefined, false, 10), { cleaned: true, diedAt: 10 });
});
