import assert from "node:assert/strict";
import test from "node:test";

import { calculateAttackInteraction, calculateInvestigationInteraction } from "./interaction-calculator";

test("calculator delegates attack and investigation rules to engine modules", () => {
  assert.equal(calculateAttackInteraction("basic", "none", [{ attackLevel: "basic", defenseLevel: "none", success: true }]).reasonCode, "ATTACK_SUCCEEDED");
  const target = { uid: "u", name: "U", alive: true, roleId: "r", faction: "town" as const, defense: "none" as const, statuses: [], investigativeAppearance: { sheriff: "INOCENTE" } };
  assert.equal(calculateInvestigationInteraction(target, "sheriff").result, "INOCENTE");
  assert.equal(calculateInvestigationInteraction(target, "unknown").reasonCode, "RULE_NOT_MODELED");
});
