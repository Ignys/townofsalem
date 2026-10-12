import assert from "node:assert/strict";
import test from "node:test";

import { checkWinCondition, type WinConditionRule } from "./win-condition";
import type { EngineGameState } from "./types";

const state: EngineGameState = { gameId: "g", nightId: "n", players: [{ uid: "town", name: "Town", alive: true, roleId: "r", faction: "town", canDieAtNight: true, statuses: [] }] };

test("does not invent a winner when no confirmed rule is supplied", () => {
  const result = checkWinCondition(state, []);
  assert.equal(result.gameOver, false);
  assert.equal(result.reasonCode, "NO_CONFIRMED_WIN_CONDITION");
});

function player(uid: string, roleId: string, faction: "town" | "mafia" | "neutral", alive = true) {
  return { uid, name: uid, alive, roleId, faction, canDieAtNight: true, statuses: [] as string[] };
}

function game(...players: ReturnType<typeof player>[]): EngineGameState {
  return { gameId: "g", nightId: "n", nightNumber: 3, players };
}

test("the town wins once every mafia member and neutral killer is dead", () => {
  const result = checkWinCondition(game(
    player("ana", "doctor", "town"),
    player("bia", "sheriff", "town", false),
    player("fay", "townie", "town"),
    player("caio", "mafioso", "mafia", false),
    player("dex", "jester", "neutral"),
  ));
  assert.equal(result.gameOver, true);
  assert.equal(result.reasonCode, "TOWN_ELIMINATED_OPPOSITION");
  assert.deepEqual(result.winningFactions, ["town"]);
  // A facção inteira vence, inclusive quem morreu no caminho.
  assert.deepEqual(result.winningPlayerUids, ["ana", "bia", "fay"]);
});

test("the mafia wins when nobody who resists is left", () => {
  const result = checkWinCondition(game(
    player("ana", "doctor", "town", false),
    player("caio", "mafioso", "mafia"),
    player("eva", "godfather", "mafia", false),
    player("dex", "executioner", "neutral"),
  ));
  assert.deepEqual(result.winningFactions, ["mafia"]);
  assert.deepEqual(result.winningPlayerUids, ["caio", "eva"]);
});

test("a neutral killer wins alone", () => {
  const result = checkWinCondition(game(
    player("ana", "doctor", "town", false),
    player("caio", "mafioso", "mafia", false),
    player("sk", "serial-killer", "neutral"),
  ));
  assert.deepEqual(result.winningFactions, ["neutral"]);
  assert.deepEqual(result.winningPlayerUids, ["sk"]);
});

test("the game goes on while opposing sides are alive", () => {
  assert.equal(checkWinCondition(game(
    player("ana", "doctor", "town"),
    player("caio", "mafioso", "mafia"),
  )).gameOver, false);
  assert.equal(checkWinCondition(game(
    player("caio", "mafioso", "mafia"),
    player("sk", "serial-killer", "neutral"),
    player("dex", "jester", "neutral"),
  )).gameOver, false);
});

test("a survivor is town and cannot be killed by a lone killer: the stalemate rule wins first", () => {
  const result = checkWinCondition(game(
    player("sur", "survivor", "town"),
    player("caio", "mafioso", "mafia"),
  ));
  assert.equal(result.reasonCode, "SURVIVOR_KILLER_STALEMATE");
  assert.deepEqual(result.winningFactions, ["mafia"]);
});

test("nobody wins when only benign neutrals are left", () => {
  const result = checkWinCondition(game(
    player("dex", "jester", "neutral"),
    player("eva", "executioner", "neutral"),
    player("ana", "doctor", "town", false),
  ));
  assert.equal(result.gameOver, true);
  assert.equal(result.reasonCode, "NO_SIDE_LEFT_DRAW");
  assert.deepEqual(result.winningFactions, []);
});

test("uses modular confirmed rules without ending the game as a side effect", () => {
  const fixture: WinConditionRule = { id: "fixture", evaluate: (game) => game.players.every(({ faction }) => faction === "town") ? { gameOver: true, winningFactions: ["town"], winningPlayerUids: ["town"], reasonCode: "FIXTURE_TOWN_ONLY" } : null };
  const result = checkWinCondition(state, [fixture]);
  assert.equal(result.gameOver, true);
  assert.deepEqual(result.winningFactions, ["town"]);
});
