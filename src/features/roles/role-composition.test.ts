import assert from "node:assert/strict";
import test from "node:test";

import {
  compositionRecordToRoleIds,
  roleIdsToCompositionRecord,
} from "./role-composition";

test("converts role ids to Firebase counts and back", () => {
  const record = roleIdsToCompositionRecord([
    "doctor",
    "sheriff",
    "doctor",
  ]);

  assert.deepEqual(record, { doctor: 2, sheriff: 1 });
  assert.deepEqual(compositionRecordToRoleIds(record), [
    "doctor",
    "doctor",
    "sheriff",
  ]);
});

test("treats a missing Firebase composition as empty", () => {
  assert.deepEqual(compositionRecordToRoleIds(null), []);
});
