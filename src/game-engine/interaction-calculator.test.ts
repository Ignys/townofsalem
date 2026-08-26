import assert from "node:assert/strict";
import test from "node:test";

import { calculateInvestigationInteraction } from "./interaction-calculator";

test("calculator resolves configured investigation mappings", () => {
  const target = { uid: "u", name: "U", alive: true, roleId: "r", faction: "town" as const, canDieAtNight: true, statuses: [], investigativeAppearance: { sheriff: "INOCENTE" } };
  assert.equal(calculateInvestigationInteraction(target, "sheriff").result, "INOCENTE");
  assert.equal(calculateInvestigationInteraction(target, "unknown").reasonCode, "RULE_NOT_MODELED");
});
