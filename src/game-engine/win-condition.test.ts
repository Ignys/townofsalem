import assert from "node:assert/strict";
import test from "node:test";

import { checkWinCondition, type WinConditionRule } from "./win-condition";
import type { EngineGameState } from "./types";

const state: EngineGameState = { gameId: "g", nightId: "n", players: [{ uid: "town", name: "Town", alive: true, roleId: "r", faction: "town", defense: "none", statuses: [] }] };

test("does not invent a winner when no confirmed rule is supplied", () => {
  const result = checkWinCondition(state);
  assert.equal(result.gameOver, false);
  assert.equal(result.reasonCode, "NO_CONFIRMED_WIN_CONDITION");
});

test("uses modular confirmed rules without ending the game as a side effect", () => {
  const fixture: WinConditionRule = { id: "fixture", evaluate: (game) => game.players.every(({ faction }) => faction === "town") ? { gameOver: true, winningFactions: ["town"], winningPlayerUids: ["town"], reasonCode: "FIXTURE_TOWN_ONLY" } : null };
  const result = checkWinCondition(state, [fixture]);
  assert.equal(result.gameOver, true);
  assert.deepEqual(result.winningFactions, ["town"]);
});
