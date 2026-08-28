import assert from "node:assert/strict";
import test from "node:test";

import { withDefaultVariants } from "@/game-engine/variants";

import { getActiveRoleVariants } from "./active-role-variants";

test("returns only variants that affect the selected role", () => {
  const variants = withDefaultVariants({
    bodyguardCannotGuardSameTargetTwice: true,
    doctorCanSelfHealOnce: true,
    doctorCannotSaveBodyguardSacrifice: false,
  });

  assert.deepEqual(getActiveRoleVariants("bodyguard", variants), [
    "Você não pode proteger a mesma pessoa em duas noites seguidas.",
  ]);
  assert.deepEqual(getActiveRoleVariants("doctor", variants), [
    "Uma vez durante a partida, você pode escolher a si mesmo para curar.",
  ]);
  assert.deepEqual(getActiveRoleVariants("townie", variants), []);
});

test("explains the Sheriff detection variant from each affected perspective", () => {
  const variants = withDefaultVariants({
    doctorCannotSaveBodyguardSacrifice: false,
    sheriffWerewolfDetection: "full-moon",
  });

  assert.match(getActiveRoleVariants("sheriff", variants)[0], /Werewolf aparece como Evil/);
  assert.match(getActiveRoleVariants("deputy", variants)[0], /assumir a função de Sheriff/);
  assert.match(getActiveRoleVariants("werewolf", variants)[0], /você aparece como Evil/);
});

test("includes every enabled variant for a role without exposing disabled ones", () => {
  const variants = withDefaultVariants({
    doctorCanSelfHealOnce: true,
    doctorCannotSaveBodyguardSacrifice: true,
  });

  assert.equal(getActiveRoleVariants("doctor", variants).length, 2);
  assert.equal(getActiveRoleVariants("bodyguard", variants).length, 1);
});

test("covers every role variant supported by the game settings", () => {
  const variants = withDefaultVariants({
    bodyguardCannotGuardSameTargetTwice: true,
    doctorCanSelfHealOnce: true,
    doctorCannotSaveBodyguardSacrifice: true,
    blackmailedCannotVote: true,
    sheriffWerewolfDetection: "always",
    werewolfImmuneDuringFullMoon: true,
    godfatherDoubleKillWhenLastMafia: true,
    survivorLynchBlocksTownNextNight: true,
    witchDeathKillsCursedPlayers: true,
    jesterWinEndsGame: true,
    executionerWinEndsGame: true,
  });
  const expectedCounts: Readonly<Record<string, number>> = {
    bodyguard: 2,
    doctor: 2,
    sheriff: 1,
    deputy: 1,
    survivor: 1,
    blackmailer: 1,
    godfather: 1,
    executioner: 1,
    jester: 1,
    werewolf: 2,
    witch: 1,
  };

  for (const [roleId, expectedCount] of Object.entries(expectedCounts)) {
    assert.equal(
      getActiveRoleVariants(roleId, variants).length,
      expectedCount,
      roleId,
    );
  }
});
