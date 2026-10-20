import assert from "node:assert/strict";
import test from "node:test";

import { splitForcedRoles } from "./forced-roles";

test("pinned players take their role out of the deck", () => {
  assert.deepEqual(
    splitForcedRoles(
      ["a", "b", "c"],
      ["doctor", "mafioso", "random-town"],
      ["doctor", "mafioso", "sheriff"],
      { b: "doctor", gone: "mafioso" },
    ),
    { forced: { b: "doctor" }, remainingUids: ["a", "c"], remainingRoleIds: ["mafioso", "sheriff"] },
  );
});

test("a pin needs a fixed role left in the composition", () => {
  assert.deepEqual(
    splitForcedRoles(["a", "b"], ["doctor", "random-town"], ["doctor", "sheriff"], { a: "sheriff" }),
    { invalid: "sheriff" },
  );
  assert.deepEqual(
    splitForcedRoles(["a", "b"], ["doctor", "mafioso"], ["doctor", "mafioso"], { a: "doctor", b: "doctor" }),
    { invalid: "doctor" },
  );
});
