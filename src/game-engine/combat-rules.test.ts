import assert from "node:assert/strict";
import test from "node:test";

import { resolveNight } from "./resolve-night";
import { engineAction, engineGame, enginePlayer } from "./engine-test-fixtures";

const firstChoice = { pickIndex: () => 0 };

function mafiaAttack(targetUid: string, participants = ["godfather", "mafioso"]) {
  return engineAction("mafia", "godfather", "godfather", "mafia-attack", [targetUid], {
    sourceType: "faction",
    sourceFaction: "mafia",
    participantUids: participants,
  });
}

function doctor(targetUid: string) {
  return engineAction("doctor", "doctor", "doctor", "protect", [targetUid], {
    effectType: "protect",
    priority: 30,
    protectionType: "doctor",
    blockedByTargetStatuses: ["mayor-revealed"],
  });
}

function bodyguard(targetUid: string) {
  return engineAction("bodyguard", "bodyguard", "bodyguard", "guard", [targetUid], {
    effectType: "protect",
    priority: 30,
    protectionType: "bodyguard",
  });
}

function alert(veteranUid = "veteran") {
  return engineAction("alert", veteranUid, "veteran", "alert", [], {
    effectType: "protect",
    priority: 20,
    countsAsVisit: false,
  });
}

test("Mafia kills an unprotected target and Doctor prevents that death", () => {
  const players = [
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("target", "townie"),
  ];
  assert.deepEqual(resolveNight(engineGame(players), [mafiaAttack("target")]).deaths, ["target"]);
  const healed = resolveNight(engineGame(players), [mafiaAttack("target"), doctor("target")]);
  assert.deepEqual(healed.deaths, []);
  assert.ok(healed.engineEvents.some(({ type }) => type === "DOCTOR_PREVENTED_DEATH"));
});

test("Doctor cannot heal a revealed Mayor and heals every normal attack", () => {
  const players = [
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
    enginePlayer("sk", "serial-killer", "neutral"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("target", "mayor", "town", { statuses: ["mayor-revealed"] }),
  ];
  const mayor = resolveNight(engineGame(players), [mafiaAttack("target"), doctor("target")]);
  assert.deepEqual(mayor.deaths, ["target"]);

  const normalTarget = players.map((player) =>
    player.uid === "target" ? { ...player, roleId: "townie", statuses: [] } : player,
  );
  const healed = resolveNight(engineGame(normalTarget), [
    mafiaAttack("target"),
    engineAction("sk", "sk", "serial-killer", "attack", ["target"]),
    doctor("target"),
  ]);
  assert.deepEqual(healed.deaths, []);
});

test("Bodyguard intercepts one attack, sacrifices itself and counterattacks a random Mafia", () => {
  const players = [
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
    enginePlayer("bodyguard", "bodyguard"),
    enginePlayer("target", "townie"),
  ];
  const result = resolveNight(engineGame(players), [mafiaAttack("target"), bodyguard("target")], { randomSource: firstChoice });
  assert.deepEqual(result.deaths, ["bodyguard", "godfather"]);
  assert.equal(result.deathRecords?.find(({ targetUid }) => targetUid === "bodyguard")?.cause, "bodyguard-sacrifice");
  assert.ok(result.engineEvents.some(({ type }) => type === "MAFIA_MEMBER_RANDOMLY_SELECTED"));
});

test("Doctor never saves the default Bodyguard sacrifice", () => {
  const players = [
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
    enginePlayer("bodyguard", "bodyguard"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("target", "townie"),
  ];
  const result = resolveNight(engineGame(players), [
    mafiaAttack("target"),
    bodyguard("target"),
    doctor("bodyguard"),
  ], { randomSource: firstChoice });
  assert.ok(result.deaths.includes("bodyguard"));
});

test("Doctor saves the Bodyguard sacrifice when the variant allows it", () => {
  const players = [
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
    enginePlayer("bodyguard", "bodyguard"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("target", "townie"),
  ];
  const result = resolveNight(engineGame(players, {
    variants: { doctorCannotSaveBodyguardSacrifice: false },
  }), [
    mafiaAttack("target"),
    bodyguard("target"),
    doctor("bodyguard"),
  ], { randomSource: firstChoice });

  assert.ok(!result.deaths.includes("bodyguard"));
  assert.ok(result.survivors?.some(({ targetUid }) => targetUid === "bodyguard"));
  assert.ok(result.engineEvents.some(({ reasonCode }) =>
    reasonCode === "BODYGUARD_SACRIFICE_HEALED_BY_VARIANT"
  ));
});

test("Bodyguard activates before Doctor on the same target", () => {
  const players = [
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
    enginePlayer("sk", "serial-killer", "neutral"),
    enginePlayer("bodyguard", "bodyguard"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("target", "townie"),
  ];
  const result = resolveNight(engineGame(players), [
    mafiaAttack("target"),
    engineAction("sk", "sk", "serial-killer", "attack", ["target"]),
    bodyguard("target"),
    doctor("target"),
  ], { randomSource: firstChoice });
  assert.ok(result.deaths.includes("bodyguard"));
  assert.ok(!result.deaths.includes("target"));
});

test("Bodyguard intercepts only one of multiple attacks", () => {
  const players = [
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
    enginePlayer("sk", "serial-killer", "neutral"),
    enginePlayer("bodyguard", "bodyguard"),
    enginePlayer("target", "townie"),
  ];
  const result = resolveNight(engineGame(players), [
    mafiaAttack("target"),
    engineAction("sk", "sk", "serial-killer", "attack", ["target"]),
    bodyguard("target"),
  ], { randomSource: firstChoice });
  assert.ok(result.deaths.includes("target"));
  assert.equal(result.randomDecisions?.[0].key, "bodyguard-intercept:bodyguard");
});

test("Serial Killer survives the Bodyguard counterattack", () => {
  const players = [
    enginePlayer("sk", "serial-killer", "neutral"),
    enginePlayer("bodyguard", "bodyguard"),
    enginePlayer("target", "townie"),
  ];
  const result = resolveNight(engineGame(players), [
    engineAction("sk", "sk", "serial-killer", "attack", ["target"]),
    bodyguard("target"),
  ]);
  assert.deepEqual(result.deaths, ["bodyguard"]);
  assert.ok(result.survivors.some(({ targetUid }) => targetUid === "sk"));
});

test("Bodyguard intercepts a Veteran attack on a protected visitor", () => {
  const players = [
    enginePlayer("veteran", "veteran"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("bodyguard", "bodyguard"),
  ];
  const result = resolveNight(engineGame(players), [
    alert(),
    doctor("veteran"),
    bodyguard("doctor"),
  ]);
  assert.deepEqual(result.deaths, ["bodyguard"]);
  assert.ok(result.survivors.some(({ targetUid }) => targetUid === "veteran"));
});

test("Bodyguard protects only one of the Werewolf's two independent targets", () => {
  const players = [
    enginePlayer("werewolf", "werewolf", "neutral"),
    enginePlayer("bodyguard", "bodyguard"),
    enginePlayer("left", "townie"),
    enginePlayer("right", "townie"),
  ];
  const result = resolveNight(engineGame(players), [
    engineAction("wolf", "werewolf", "werewolf", "full-moon-attack", ["left", "right"]),
    bodyguard("left"),
  ]);
  assert.deepEqual(result.deaths, ["bodyguard", "right", "werewolf"]);
});

test("Veteran attacks one or many visitors, including only one Mafia representative", () => {
  const players = [
    enginePlayer("veteran", "veteran"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("sheriff", "sheriff", "town", { investigativeAppearance: { sheriff: "Good" } }),
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("mafioso", "mafioso", "mafia"),
  ];
  const multiple = resolveNight(engineGame(players), [
    alert(),
    doctor("veteran"),
    engineAction("sheriff", "sheriff", "sheriff", "investigate", ["veteran"], { effectType: "investigate", priority: 40, investigationType: "sheriff" }),
  ]);
  assert.deepEqual(multiple.deaths, ["doctor", "sheriff"]);

  const mafia = resolveNight(engineGame(players), [alert(), mafiaAttack("veteran")], { randomSource: firstChoice });
  assert.deepEqual(mafia.deaths, ["godfather"]);
  assert.ok(mafia.survivors.some(({ targetUid }) => targetUid === "veteran"));
});

test("Serial Killer and Survivor have intrinsic night immunity", () => {
  const players = [
    enginePlayer("attacker", "vigilante"),
    enginePlayer("sk", "serial-killer", "neutral"),
    enginePlayer("survivor", "survivor"),
  ];
  const result = resolveNight(engineGame(players), [
    engineAction("shot-sk", "attacker", "vigilante", "shoot", ["sk"]),
    engineAction("shot-survivor", "attacker", "vigilante", "shoot", ["survivor"]),
  ]);
  assert.deepEqual(result.deaths, []);
});

test("Janitor consumes a clean only when the collective Mafia attack kills", () => {
  const players = [
    enginePlayer("godfather", "godfather", "mafia"),
    enginePlayer("janitor", "janitor", "mafia"),
    enginePlayer("doctor", "doctor"),
    enginePlayer("target", "townie"),
  ];
  const clean = engineAction("clean", "janitor", "janitor", "clean", [], { effectType: "clean", priority: 60 });
  const killed = resolveNight(engineGame(players), [mafiaAttack("target", ["godfather", "janitor"]), clean]);
  assert.deepEqual(killed.cleanedPlayerUids, ["target"]);
  assert.equal(killed.consumedResources?.[0].amount, 1);
  const saved = resolveNight(engineGame(players), [mafiaAttack("target", ["godfather", "janitor"]), doctor("target"), clean]);
  assert.deepEqual(saved.cleanedPlayerUids, []);
  assert.deepEqual(saved.consumedResources, []);

  const exhausted = resolveNight(engineGame(players, {
    resourceUses: { "janitor:janitor": 2 },
  }), [mafiaAttack("target", ["godfather", "janitor"])]);
  assert.deepEqual(exhausted.cleanedPlayerUids, []);
  assert.deepEqual(exhausted.consumedResources, []);
});
