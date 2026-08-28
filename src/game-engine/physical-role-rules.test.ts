import assert from "node:assert/strict";
import test from "node:test";

import { resolveJesterRevenge } from "./day-effects";
import { engineAction, engineGame, enginePlayer } from "./engine-test-fixtures";
import {
  getMediumClueCandidateCount,
  getRoleResourceLimit,
} from "./role-resource-limits";
import { arePlayersAdjacent, canUseActionOnNight } from "./role-rules";
import { resolveNight } from "./resolve-night";
import { getRoleById } from "@/data/roles";

test("Werewolf acts only on even nights and ignores dead seats for adjacency", () => {
  const action = getRoleById("werewolf")?.action;
  assert.ok(action);
  assert.equal(canUseActionOnNight(action, 2), true);
  assert.equal(canUseActionOnNight(action, 3), false);

  const players = [
    { uid: "joao", seat: 1, alive: true },
    { uid: "pedro", seat: 2, alive: false },
    { uid: "maria", seat: 3, alive: true },
  ];
  assert.equal(arePlayersAdjacent(players[0], players[2], players), true);
});

test("Jester revenge accepts only a Guilty voter and is unavoidable", () => {
  const votes = { peaceful: "innocent", spiteful: "guilty" } as const;
  assert.equal(resolveJesterRevenge(votes, "peaceful").valid, false);
  const revenge = resolveJesterRevenge(votes, "spiteful");
  assert.equal(revenge.killedPlayerUid, "spiteful");
  assert.equal(revenge.unavoidable, true);
});

test("Executioner becomes Jester when its marked target dies at night", () => {
  const players = [
    enginePlayer("executioner", "executioner", "neutral"),
    enginePlayer("attacker", "serial-killer", "neutral"),
    enginePlayer("target", "townie", "town", { statuses: ["execution-target:executioner"] }),
  ];
  const result = resolveNight(engineGame(players), [
    engineAction("attack", "attacker", "serial-killer", "attack", ["target"]),
  ]);
  assert.deepEqual(result.roleChanges, [{
    playerUid: "executioner",
    fromRoleId: "executioner",
    toRoleId: "jester",
    reasonCode: "EXECUTIONER_TARGET_DIED_AT_NIGHT",
  }]);
});

test("Witch kills all other living cursed players and wins automatically", () => {
  const players = [
    enginePlayer("witch", "witch", "neutral"),
    enginePlayer("first", "townie", "town", { statuses: ["cursed"] }),
    enginePlayer("second", "townie"),
  ];
  const result = resolveNight(engineGame(players), [
    engineAction("curse", "witch", "witch", "curse", ["second"], {
      effectType: "status-effect",
      priority: 55,
      statusType: "cursed",
    }),
  ]);
  assert.deepEqual(result.deaths, ["first", "second"]);
  assert.deepEqual(result.individualWinnerUids, ["witch"]);
});

test("all player-count resources use the centralized 1–9 / 10–14 / 15+ tiers", () => {
  for (const roleId of ["mayor", "investigator", "consigliere", "janitor", "veteran"]) {
    assert.deepEqual(
      [getRoleResourceLimit(roleId, 9), getRoleResourceLimit(roleId, 10), getRoleResourceLimit(roleId, 15)],
      [2, 3, 4],
    );
  }
  assert.deepEqual(
    [getRoleResourceLimit("vigilante", 9), getRoleResourceLimit("vigilante", 10), getRoleResourceLimit("vigilante", 15)],
    [1, 2, 3],
  );
  assert.deepEqual(
    [getMediumClueCandidateCount(9), getMediumClueCandidateCount(10), getMediumClueCandidateCount(15)],
    [2, 3, 4],
  );
});

test("Amnesiac remembers a seeded role from the host-configured pool on Night 3", () => {
  const result = resolveNight(engineGame([
    enginePlayer("amnesiac", "amnesiac", "neutral"),
    enginePlayer("target", "townie"),
  ], {
    nightId: "night-3",
    nightNumber: 3,
    amnesiacRolePool: ["sheriff", "doctor"],
  }), [
    engineAction("remember", "amnesiac", "amnesiac", "remember-role", [], {
      effectType: "role-trigger",
      priority: 5,
    }),
  ], { randomSource: { pickIndex: () => 0 } });

  assert.equal(result.roleChanges?.[0].toRoleId, "doctor");
  assert.equal(result.randomDecisions?.[0].selectedUid, "doctor");
});

test("the pure resolver rejects Mafia, Serial Killer and Vigilante attacks on Night 1", () => {
  const result = resolveNight(engineGame([
    enginePlayer("mafia", "mafioso", "mafia"),
    enginePlayer("sk", "serial-killer", "neutral"),
    enginePlayer("vigilante", "vigilante"),
    enginePlayer("target", "townie"),
  ], { nightId: "night-1", nightNumber: 1 }), [
    engineAction("mafia", "mafia", "mafioso", "mafia-attack", ["target"], {
      sourceType: "faction",
      sourceFaction: "mafia",
      participantUids: ["mafia"],
    }),
    engineAction("sk", "sk", "serial-killer", "attack", ["target"]),
    engineAction("shot", "vigilante", "vigilante", "shoot", ["target"]),
  ]);

  assert.deepEqual(result.deaths, []);
  assert.deepEqual(result.failedActions, ["mafia", "shot", "sk"]);
});
