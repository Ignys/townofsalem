import assert from "node:assert/strict";
import test from "node:test";

import { findRejoinSeat } from "./find-rejoin-seat";

test("finds the seat by nickname, ignoring case and spacing", () => {
  const players = { a: { name: "Luiz" }, b: { name: "Ana Clara" } };
  assert.equal(findRejoinSeat(players, " luiz "), "a");
  assert.equal(findRejoinSeat(players, "ana  clara"), "b");
  assert.equal(findRejoinSeat(players, "Beto"), null);
});

test("an ambiguous nickname finds no seat", () => {
  assert.equal(findRejoinSeat({ a: { name: "Luiz" }, b: { name: "luiz" } }, "Luiz"), null);
});
