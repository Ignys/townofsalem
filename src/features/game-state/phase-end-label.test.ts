import assert from "node:assert/strict";
import test from "node:test";

import { getNightEndLabel, shouldConfirmNightEnd } from "./phase-end-label";

test("labels the current numbered night when it will be ended", () => {
  assert.equal(getNightEndLabel({ nightNumber: 2 }), "Noite 2");
});

test("requires confirmation only while leaving the night phase", () => {
  assert.equal(shouldConfirmNightEnd("night"), true);
  assert.equal(shouldConfirmNightEnd("day"), false);
  assert.equal(shouldConfirmNightEnd("discussion"), false);
  assert.equal(shouldConfirmNightEnd("trial"), false);
  assert.equal(shouldConfirmNightEnd("defense"), false);
  assert.equal(shouldConfirmNightEnd("verdict"), false);
  assert.equal(shouldConfirmNightEnd("custom"), false);
});
