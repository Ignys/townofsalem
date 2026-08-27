import assert from "node:assert/strict";
import test from "node:test";

import { getInvestigationResult, getSheriffInvestigationResult } from "./investigation";
import { enginePlayer } from "./engine-test-fixtures";
import { withDefaultVariants } from "./variants";

test("Sheriff uses the explicit physical-card matrix", () => {
  const cases = [
    [enginePlayer("p", "politician"), "Evil"],
    [enginePlayer("p", "godfather", "mafia"), "Good"],
    [enginePlayer("p", "serial-killer", "neutral"), "Evil"],
    [enginePlayer("p", "witch", "neutral"), "Good"],
    [enginePlayer("p", "executioner", "neutral"), "Good"],
    [enginePlayer("p", "jester", "neutral"), "Good"],
  ] as const;
  for (const [player, expected] of cases) {
    assert.equal(getSheriffInvestigationResult(player, 2, "normal"), expected);
  }
});

test("Sheriff Werewolf detection follows each configured variant", () => {
  const werewolf = enginePlayer("wolf", "werewolf", "neutral");
  assert.equal(getSheriffInvestigationResult(werewolf, 2, "normal"), "Good");
  assert.equal(getSheriffInvestigationResult(werewolf, 2, "full-moon"), "Evil");
  assert.equal(getSheriffInvestigationResult(werewolf, 3, "full-moon"), "Good");
  assert.equal(getSheriffInvestigationResult(werewolf, 3, "always"), "Evil");
});

test("Investigator and Consigliere reveal exact roles despite false Sheriff appearances", () => {
  const variants = withDefaultVariants();
  const godfather = enginePlayer("gf", "godfather", "mafia", {
    investigativeAppearance: { sheriff: "Good", "exact-role": "Godfather" },
  });
  const politician = enginePlayer("p", "politician", "town", {
    investigativeAppearance: { sheriff: "Evil", "exact-role": "Politician" },
  });
  assert.equal(getInvestigationResult(godfather, "exact-role", 2, variants), "Godfather");
  assert.equal(getInvestigationResult(politician, "exact-role", 2, variants), "Politician");
});
