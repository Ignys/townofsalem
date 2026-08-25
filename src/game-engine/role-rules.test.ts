import assert from "node:assert/strict";
import test from "node:test";

import { getRoleById } from "@/data/roles";
import {
  arePlayersAdjacent,
  canReceiveDoctorProtection,
  canUseActionOnNight,
  deputyHasSheriffAbility,
  executionerBecomesJester,
  getForcedVerdict,
  getJesterRevengeTargets,
  getVerdictVoteWeight,
  resolveMafiaVoteTarget,
} from "./role-rules";

test("models forced verdicts and the revealed Mayor vote weight", () => {
  assert.equal(getForcedVerdict("peaceful-townie"), "innocent");
  assert.equal(getForcedVerdict("spiteful-townie"), "guilty");
  assert.equal(getForcedVerdict("townie"), null);
  assert.equal(getVerdictVoteWeight("mayor", ["mayor-revealed"]), 2);
  assert.equal(getVerdictVoteWeight("mayor", []), 1);
});

test("models Doctor, Jester and Executioner day interactions", () => {
  assert.equal(canReceiveDoctorProtection("mayor", ["mayor-revealed"]), false);
  assert.equal(canReceiveDoctorProtection("mayor", []), true);
  assert.deepEqual(
    getJesterRevengeTargets({
      peaceful: "innocent",
      spiteful: "guilty",
      townie: "abstain",
    }),
    ["spiteful"],
  );
  assert.equal(executionerBecomesJester("night"), true);
  assert.equal(executionerBecomesJester("hanging"), false);
  assert.equal(executionerBecomesJester("other-day"), null);
});

test("activates Deputy only after no living Sheriff remains", () => {
  assert.equal(
    deputyHasSheriffAbility([
      { alive: true, roleId: "deputy" },
      { alive: true, roleId: "sheriff" },
    ]),
    false,
  );
  assert.equal(
    deputyHasSheriffAbility([
      { alive: true, roleId: "deputy" },
      { alive: false, roleId: "sheriff" },
    ]),
    true,
  );
});

test("enforces Night 1, Night 3 and full-moon action schedules", () => {
  const vigilante = getRoleById("vigilante")?.action;
  const amnesiac = getRoleById("amnesiac")?.action;
  const werewolf = getRoleById("werewolf")?.action;
  assert.ok(vigilante && amnesiac && werewolf);
  assert.equal(canUseActionOnNight(vigilante, 1), false);
  assert.equal(canUseActionOnNight(vigilante, 2), true);
  assert.equal(canUseActionOnNight(amnesiac, 2), false);
  assert.equal(canUseActionOnNight(amnesiac, 3), true);
  assert.equal(canUseActionOnNight(werewolf, 3), false);
  assert.equal(canUseActionOnNight(werewolf, 4), true);
});

test("checks circular table adjacency and Godfather tie breaking", () => {
  const players = [
    { uid: "a", seat: 1 },
    { uid: "b", seat: 2 },
    { uid: "c", seat: 3 },
  ];
  assert.equal(arePlayersAdjacent(players[0], players[1], players), true);
  assert.equal(arePlayersAdjacent(players[0], players[2], players), true);
  assert.equal(
    resolveMafiaVoteTarget({ godfather: "x", mafioso: "y" }, "godfather"),
    "x",
  );
  assert.equal(resolveMafiaVoteTarget({ a: "x", b: "y" }), null);
});
