import assert from "node:assert/strict";
import { test } from "node:test";

import { engineGame, enginePlayer } from "./engine-test-fixtures";
import { resolveAssistedDayDeath } from "./resolve-day";

function gameWithExecutioner(targetOverrides = {}) {
  return engineGame([
    enginePlayer("exec", "executioner", "neutral"),
    enginePlayer("target", "townie", "town", { statuses: ["execution-target:exec"], ...targetOverrides }),
    enginePlayer("other", "doctor"),
  ]);
}

test("a lynched execution target makes the Executioner win", () => {
  const resolution = resolveAssistedDayDeath(gameWithExecutioner(), {
    targetUid: "target",
    kind: "lynch",
  });

  assert.deepEqual(resolution.deaths, [
    { targetUid: "target", cause: "hanging", unavoidable: true },
  ]);
  assert.deepEqual(resolution.individualWinnerUids, ["exec"]);
  assert.deepEqual(resolution.appliedStatuses, [
    { targetUid: "exec", statusType: "executioner-won" },
  ]);
  assert.deepEqual(resolution.roleChanges, []);
});

test("a non-lynch day death of the target asks the host to decide", () => {
  const resolution = resolveAssistedDayDeath(gameWithExecutioner(), {
    targetUid: "target",
    kind: "other-day",
  });

  assert.deepEqual(resolution.deaths, [
    { targetUid: "target", cause: "day-death", unavoidable: true },
  ]);
  assert.deepEqual(resolution.pendingExecutionerDecisionUids, ["exec"]);
  assert.deepEqual(resolution.individualWinnerUids, []);
  assert.equal(resolution.warnings.length, 1);
});

test("the host can turn the Executioner into a Jester after a non-lynch day death", () => {
  const resolution = resolveAssistedDayDeath(gameWithExecutioner(), {
    targetUid: "target",
    kind: "other-day",
    executionerBecomesJester: true,
  });

  assert.deepEqual(resolution.warnings, []);
  assert.deepEqual(resolution.pendingExecutionerDecisionUids, []);
  assert.deepEqual(resolution.roleChanges, [{
    playerUid: "exec",
    fromRoleId: "executioner",
    toRoleId: "jester",
    reasonCode: "EXECUTIONER_TARGET_DIED_DURING_THE_DAY",
  }]);
});

test("the host can keep the Executioner unchanged after a non-lynch day death", () => {
  const resolution = resolveAssistedDayDeath(gameWithExecutioner(), {
    targetUid: "target",
    kind: "other-day",
    executionerBecomesJester: false,
  });

  assert.deepEqual(resolution.warnings, []);
  assert.deepEqual(resolution.roleChanges, []);
  assert.deepEqual(resolution.individualWinnerUids, []);
});

test("a dead Executioner neither wins nor transforms", () => {
  const state = engineGame([
    enginePlayer("exec", "executioner", "neutral", { alive: false }),
    enginePlayer("target", "townie", "town", { statuses: ["execution-target:exec"] }),
  ]);

  const lynch = resolveAssistedDayDeath(state, { targetUid: "target", kind: "lynch" });
  assert.deepEqual(lynch.individualWinnerUids, []);

  const other = resolveAssistedDayDeath(state, { targetUid: "target", kind: "other-day" });
  assert.deepEqual(other.pendingExecutionerDecisionUids, []);
  assert.deepEqual(other.roleChanges, []);
});

test("a lynched Jester wins and requires a revenge target", () => {
  const state = engineGame([
    enginePlayer("joker", "jester", "neutral"),
    enginePlayer("voter", "townie"),
  ]);

  const missing = resolveAssistedDayDeath(state, { targetUid: "joker", kind: "lynch" });
  assert.deepEqual(missing.individualWinnerUids, ["joker"]);
  assert.equal(missing.warnings[0].code, "JESTER_REVENGE_TARGET_REQUIRED");

  const resolved = resolveAssistedDayDeath(state, {
    targetUid: "joker",
    kind: "lynch",
    jesterRevengeTargetUid: "voter",
  });
  assert.deepEqual(resolved.warnings, []);
  assert.deepEqual(resolved.deaths, [
    { targetUid: "joker", cause: "hanging", unavoidable: true },
    { targetUid: "voter", cause: "jester-revenge", unavoidable: true },
  ]);
});

test("the Jester revenge rejects a dead or self target", () => {
  const state = engineGame([
    enginePlayer("joker", "jester", "neutral"),
    enginePlayer("ghost", "townie", "town", { alive: false }),
  ]);

  assert.equal(
    resolveAssistedDayDeath(state, {
      targetUid: "joker",
      kind: "lynch",
      jesterRevengeTargetUid: "ghost",
    }).warnings[0].code,
    "JESTER_REVENGE_TARGET_NOT_ALIVE",
  );
  assert.equal(
    resolveAssistedDayDeath(state, {
      targetUid: "joker",
      kind: "lynch",
      jesterRevengeTargetUid: "joker",
    }).warnings[0].code,
    "JESTER_REVENGE_TARGET_IS_THE_JESTER",
  );
});

test("a Jester who dies without being lynched neither wins nor takes revenge", () => {
  const state = engineGame([
    enginePlayer("joker", "jester", "neutral"),
    enginePlayer("voter", "townie"),
  ]);

  const resolution = resolveAssistedDayDeath(state, {
    targetUid: "joker",
    kind: "other-day",
  });

  assert.deepEqual(resolution.warnings, []);
  assert.deepEqual(resolution.individualWinnerUids, []);
  assert.deepEqual(resolution.deaths, [
    { targetUid: "joker", cause: "day-death", unavoidable: true },
  ]);
});

test("variants decide whether an individual win ends the game", () => {
  const state = gameWithExecutioner();

  assert.equal(
    resolveAssistedDayDeath(state, { targetUid: "target", kind: "lynch" }).gameEnds,
    false,
  );
  assert.equal(
    resolveAssistedDayDeath(
      engineGame(state.players, { variants: { executionerWinEndsGame: true } }),
      { targetUid: "target", kind: "lynch" },
    ).gameEnds,
    true,
  );
});

test("the lynched Survivor variant blocks the living Town", () => {
  const state = engineGame([
    enginePlayer("surv", "survivor", "neutral"),
    enginePlayer("townie", "townie"),
    enginePlayer("ghost", "doctor", "town", { alive: false }),
  ], { variants: { survivorLynchBlocksTownNextNight: true } });

  const resolution = resolveAssistedDayDeath(state, { targetUid: "surv", kind: "lynch" });

  assert.deepEqual(resolution.appliedStatuses, [
    { targetUid: "townie", statusType: "town-blocked-next-night" },
  ]);
});

test("resolving an unknown or already dead player throws", () => {
  const state = engineGame([enginePlayer("ghost", "townie", "town", { alive: false })]);

  assert.throws(
    () => resolveAssistedDayDeath(state, { targetUid: "nobody", kind: "lynch" }),
    /day-death-player-not-found/,
  );
  assert.throws(
    () => resolveAssistedDayDeath(state, { targetUid: "ghost", kind: "lynch" }),
    /day-death-player-already-dead/,
  );
});
