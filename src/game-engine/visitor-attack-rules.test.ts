import assert from "node:assert/strict";
import test from "node:test";

import { engineAction, engineGame, enginePlayer } from "./engine-test-fixtures";
import { resolveNight } from "./resolve-night";
import {
  checkWinCondition,
  getCompletedIndividualWinnerUids,
} from "./win-condition";

const firstChoice = { pickIndex: () => 0 };

function crusade(targetUid: string, actorUid = "crusader") {
  return engineAction("crusade", actorUid, "crusader", "crusade", [targetUid], {
    effectType: "protect",
    priority: 30,
    protectionType: "doctor",
    attacksVisitors: "first",
  });
}

function ambush(targetUid: string, actorUid = "ambusher") {
  return engineAction("ambush", actorUid, "ambusher", "ambush", [targetUid], {
    effectType: "status-effect",
    priority: 50,
    statusType: "ambushed",
    attacksVisitors: "first",
  });
}

function doctor(targetUid: string, actorUid = "doctor") {
  return engineAction("doctor", actorUid, "doctor", "protect", [targetUid], {
    effectType: "protect",
    priority: 30,
    protectionType: "doctor",
  });
}

function sheriff(targetUid: string, actorUid = "sheriff") {
  return engineAction("sheriff", actorUid, "sheriff", "investigate", [targetUid], {
    effectType: "investigate",
    priority: 40,
    investigationType: "sheriff",
  });
}

function mafiaAttack(targetUid: string) {
  return engineAction("mafia", "godfather", "godfather", "mafia-attack", [targetUid], {
    sourceType: "faction",
    sourceFaction: "mafia",
    participantUids: ["godfather", "mafioso"],
  });
}

test("the Crusader saves its target and kills a visitor, even a Town one", () => {
  const players = [
    enginePlayer("crusader", "crusader"),
    enginePlayer("target", "townie"),
    enginePlayer("sheriff", "sheriff"),
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
  ];

  const resolution = resolveNight(
    engineGame(players),
    [crusade("target"), sheriff("target"), mafiaAttack("target")],
    { randomSource: firstChoice },
  );

  // The protected player survives the Mafia, and one visitor pays for it.
  assert.ok(!resolution.deaths.includes("target"));
  const visitorDeaths = (resolution.deathRecords ?? [])
    .filter(({ cause }) => cause === "visitor-attack");
  assert.equal(visitorDeaths.length, 1);
  assert.equal(visitorDeaths[0].attackerUid, "crusader");
  assert.ok(["sheriff", "godfather", "mafioso"].includes(visitorDeaths[0].targetUid));
});

test("the Crusader never attacks itself or the player it protects", () => {
  const players = [
    enginePlayer("crusader", "crusader"),
    enginePlayer("target", "townie"),
  ];

  const resolution = resolveNight(
    engineGame(players),
    [crusade("target")],
    { randomSource: firstChoice },
  );

  assert.deepEqual(resolution.deaths, []);
});

test("the Ambusher kills exactly one visitor", () => {
  const players = [
    enginePlayer("ambusher", "ambusher", "mafia"),
    enginePlayer("house", "townie"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("sheriff", "sheriff"),
  ];

  const resolution = resolveNight(
    engineGame(players),
    [ambush("house"), doctor("house"), sheriff("house")],
    { randomSource: firstChoice },
  );

  const visitorDeaths = (resolution.deathRecords ?? [])
    .filter(({ cause }) => cause === "visitor-attack");
  assert.equal(visitorDeaths.length, 1, "only one visitor may be ambushed");
  assert.equal(visitorDeaths[0].attackerUid, "ambusher");
  assert.ok(["doctor", "sheriff"].includes(visitorDeaths[0].targetUid));
  assert.ok(!resolution.deaths.includes("house"));
});

test("ambushing an alerted Veteran kills the Ambusher", () => {
  const players = [
    enginePlayer("ambusher", "ambusher", "mafia"),
    enginePlayer("veteran", "veteran"),
  ];
  const alert = engineAction("alert", "veteran", "veteran", "alert", [], {
    effectType: "protect",
    priority: 20,
    countsAsVisit: false,
  });

  const resolution = resolveNight(
    engineGame(players),
    [alert, ambush("veteran")],
    { randomSource: firstChoice },
  );

  assert.ok(resolution.deaths.includes("ambusher"));
  assert.ok(!resolution.deaths.includes("veteran"));
});

test("a watched house visited by the Mafia kills one randomly chosen member", () => {
  const players = [
    enginePlayer("ambusher", "ambusher", "mafia"),
    enginePlayer("house", "townie"),
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
  ];

  const resolution = resolveNight(
    engineGame(players),
    [ambush("house"), mafiaAttack("house")],
    { randomSource: firstChoice },
  );

  const visitorDeaths = (resolution.deathRecords ?? [])
    .filter(({ cause }) => cause === "visitor-attack");
  assert.equal(visitorDeaths.length, 1);
  assert.ok(["godfather", "mafioso"].includes(visitorDeaths[0].targetUid));
  assert.ok(resolution.engineEvents.some(
    ({ type }) => type === "MAFIA_MEMBER_RANDOMLY_SELECTED",
  ));
});

test("the Veteran still attacks every visitor, not just one", () => {
  const players = [
    enginePlayer("veteran", "veteran"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("sheriff", "sheriff"),
  ];
  const alert = engineAction("alert", "veteran", "veteran", "alert", [], {
    effectType: "protect",
    priority: 20,
    countsAsVisit: false,
  });

  const resolution = resolveNight(
    engineGame(players),
    [alert, doctor("veteran"), sheriff("veteran")],
    { randomSource: firstChoice },
  );

  assert.deepEqual([...resolution.deaths].sort(), ["doctor", "sheriff"]);
});

test("the Disguiser's status marks the Disguiser, not the copied player", () => {
  const players = [
    enginePlayer("disguiser", "disguiser", "mafia"),
    enginePlayer("mayor", "mayor"),
  ];
  const disguise = engineAction(
    "disguise",
    "disguiser",
    "disguiser",
    "disguise",
    ["mayor"],
    {
      effectType: "status-effect",
      priority: 60,
      statusType: "disguised-as",
      countsAsVisit: false,
    },
  );

  const resolution = resolveNight(engineGame(players), [disguise]);

  assert.deepEqual(resolution.appliedStatuses, [
    {
      targetUid: "disguiser",
      statusType: "disguised-as:mayor",
      sourceActionId: "disguise",
    },
  ]);
});

test("the Guardian Angel wins only while its assigned target lives", () => {
  const guarded = engineGame([
    enginePlayer("angel", "guardian-angel", "neutral"),
    enginePlayer("ward", "townie", "town", { statuses: ["guardian-target:angel"] }),
    enginePlayer("townie", "townie"),
  ]);

  assert.deepEqual(getCompletedIndividualWinnerUids(guarded), ["angel"]);

  const wardDead = engineGame([
    enginePlayer("angel", "guardian-angel", "neutral"),
    enginePlayer("ward", "townie", "town", {
      alive: false,
      statuses: ["guardian-target:angel"],
    }),
    enginePlayer("townie", "townie"),
  ]);

  assert.deepEqual(getCompletedIndividualWinnerUids(wardDead), []);

  // And it reaches the caller once any end-of-game rule fires. The confirmed
  // card-game rules are all two-player stalemates that cannot involve a
  // Guardian Angel, so inject a rule to exercise the merge itself.
  const townWins = {
    id: "test-town-wins",
    evaluate: () => ({
      gameOver: true,
      winningFactions: ["town"],
      winningPlayerUids: ["townie"],
      reasonCode: "TEST",
    }),
  };
  assert.deepEqual(
    checkWinCondition(guarded, [townWins]).winningPlayerUids,
    ["angel", "townie"],
  );
});

test("the Guardian Angel's night 1 choice marks its ward", () => {
  const players = [
    enginePlayer("angel", "guardian-angel", "neutral"),
    enginePlayer("ward", "townie"),
  ];
  const choose = engineAction(
    "choose-guardian-target",
    "angel",
    "guardian-angel",
    "choose-guardian-target",
    ["ward"],
    {
      effectType: "status-effect",
      priority: 6,
      statusType: "guardian-target",
      countsAsVisit: false,
    },
  );

  const resolution = resolveNight(engineGame(players, { nightNumber: 1 }), [choose]);

  assert.deepEqual(resolution.appliedStatuses, [
    {
      targetUid: "ward",
      statusType: "guardian-target:angel",
      sourceActionId: "choose-guardian-target",
    },
  ]);
});
