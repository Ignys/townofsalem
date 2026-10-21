import assert from "node:assert/strict";
import test from "node:test";

import { engineAction, engineGame, enginePlayer } from "./engine-test-fixtures";
import { resolveNight } from "./resolve-night";

const players = [
  enginePlayer("mafioso", "mafioso", "mafia"),
  enginePlayer("framer", "framer", "mafia"),
  enginePlayer("disguiser", "disguiser", "mafia"),
  enginePlayer("sheriff", "sheriff"),
  enginePlayer("investigator", "investigator"),
  enginePlayer("lookout", "lookout"),
  enginePlayer("transporter", "transporter"),
  enginePlayer("townie", "townie", "town", { investigativeAppearance: { sheriff: "Good", "exact-role": "Townie" } }),
  enginePlayer("survivor", "survivor"),
];
const sheriffCheck = (target: string) => engineAction("sheriff-check", "sheriff", "sheriff", "investigate", [target], {
  effectType: "investigate", priority: 40, investigationType: "sheriff",
});
const exactCheck = (target: string) => engineAction("exact-check", "investigator", "investigator", "investigate-exact-role", [target], {
  effectType: "investigate", priority: 40, investigationType: "exact-role",
});
const resultOf = (resolution: ReturnType<typeof resolveNight>, actorUid: string) =>
  resolution.investigationResults.find((result) => result.actorUid === actorUid)?.result;

test("transporter swaps every action aimed at its two targets", () => {
  const resolution = resolveNight(engineGame(players), [
    engineAction("transport", "transporter", "transporter", "transport", ["townie", "survivor"], { effectType: "redirect", priority: 1 }),
    engineAction("kill", "mafioso", "mafioso", "attack", ["townie"]),
  ]);
  assert.deepEqual(resolution.deaths, []);
  assert.equal(resolution.partial, false);
});

test("framed target appears as Mafia to town investigators only", () => {
  const resolution = resolveNight(engineGame(players), [
    engineAction("frame", "framer", "framer", "frame", ["townie"], { effectType: "role-trigger", priority: 35 }),
    sheriffCheck("townie"),
    exactCheck("townie"),
  ]);
  assert.equal(resultOf(resolution, "sheriff"), "Evil");
  assert.equal(resultOf(resolution, "investigator"), "Mafioso");
});

test("disguiser borrows the chosen player's results and name", () => {
  const resolution = resolveNight(engineGame(players), [
    engineAction("disguise", "disguiser", "disguiser", "disguise", ["townie"], { effectType: "role-trigger", priority: 36 }),
    sheriffCheck("disguiser"),
    engineAction("watch", "lookout", "lookout", "watch", ["survivor"], { effectType: "investigate", priority: 42, investigationType: "lookout" }),
    engineAction("visit", "disguiser", "disguiser", "frame", ["survivor"], { effectType: "role-trigger", priority: 35 }),
  ]);
  assert.equal(resultOf(resolution, "sheriff"), "Good");
  assert.equal(resultOf(resolution, "lookout"), "visitado por townie");
});

test("lookout sees named visitors and the Mafia as a group", () => {
  const resolution = resolveNight(engineGame(players), [
    engineAction("watch", "lookout", "lookout", "watch", ["townie"], { effectType: "investigate", priority: 42, investigationType: "lookout" }),
    sheriffCheck("townie"),
    engineAction("mafia-attack", "mafioso", "mafioso", "mafia-attack", ["townie"], {
      sourceType: "faction", sourceFaction: "mafia", participantUids: ["mafioso"],
    }),
  ]);
  assert.equal(resultOf(resolution, "lookout"), "visitado por a Mafia, sheriff");
});
