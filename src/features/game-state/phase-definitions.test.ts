import assert from "node:assert/strict";
import test from "node:test";

import { PHASE_DEFINITIONS } from "./phase-definitions";

test("all playable phases remain simultaneously available to the host", () => {
  assert.deepEqual(
    PHASE_DEFINITIONS.map(({ id }) => id),
    ["day", "discussion", "trial", "defense", "verdict", "night"],
  );
});

test("phase definitions expose configurable timer metadata", () => {
  for (const definition of PHASE_DEFINITIONS) {
    assert.equal(typeof definition.label, "string");
    assert.equal(definition.hasTimer, true);
    assert.ok((definition.defaultDurationSeconds ?? 0) > 0);
  }
});
