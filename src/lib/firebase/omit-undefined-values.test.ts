import assert from "node:assert/strict";
import test from "node:test";

import { omitUndefinedValues } from "./omit-undefined-values";

test("recursively removes undefined properties before Firebase persistence", () => {
  const value = omitUndefinedValues({
    deathRecords: [
      {
        targetUid: "bodyguard",
        attackerUid: undefined,
        unavoidable: true,
      },
    ],
    optionalCollection: undefined,
    preservedNull: null,
  });

  assert.deepEqual(value, {
    deathRecords: [
      {
        targetUid: "bodyguard",
        unavoidable: true,
      },
    ],
    preservedNull: null,
  });
});
