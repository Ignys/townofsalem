import assert from "node:assert/strict";
import test from "node:test";

import { engineGame, enginePlayer } from "./engine-test-fixtures";
import { checkWinCondition } from "./win-condition";

test("Survivor plus a lone killer ends in the killer's victory", () => {
  for (const killer of [
    enginePlayer("killer", "serial-killer", "neutral"),
    enginePlayer("killer", "werewolf", "neutral"),
    enginePlayer("killer", "mafioso", "mafia"),
  ]) {
    const result = checkWinCondition(engineGame([
      enginePlayer("survivor", "survivor"),
      killer,
    ]));
    assert.equal(result.gameOver, true);
    assert.deepEqual(result.winningPlayerUids, ["killer"]);
  }
});

test("Town wins two-player non-killing stalemates against Jester or Executioner", () => {
  for (const neutralRole of ["jester", "executioner"]) {
    const result = checkWinCondition(engineGame([
      enginePlayer("town", "doctor"),
      enginePlayer("neutral", neutralRole, "neutral"),
    ]));
    assert.equal(result.gameOver, true);
    assert.deepEqual(result.winningFactions, ["town"]);
  }
});

test("two Jesters draw and two Executioners preserve only completed individual wins", () => {
  const jesters = checkWinCondition(engineGame([
    enginePlayer("first", "jester", "neutral"),
    enginePlayer("second", "jester", "neutral"),
  ]));
  assert.equal(jesters.reasonCode, "TWO_JESTERS_DRAW");
  assert.deepEqual(jesters.winningPlayerUids, []);

  const executioners = checkWinCondition(engineGame([
    enginePlayer("first", "executioner", "neutral", { statuses: ["executioner-won"] }),
    enginePlayer("second", "executioner", "neutral"),
  ]));
  assert.equal(executioners.reasonCode, "TWO_EXECUTIONERS_DRAW");
  assert.deepEqual(executioners.winningPlayerUids, ["first"]);
});
