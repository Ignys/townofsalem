import assert from "node:assert/strict";
import test from "node:test";

import { getRoleInteractionLimit } from "./role-interaction-limit";

test("shows the exact role limit for each player-count tier", () => {
  for (const [playerCount, expected] of [[9, 2], [10, 3], [15, 4]] as const) {
    assert.equal(getRoleInteractionLimit("investigator", playerCount)?.amount, expected);
    assert.equal(getRoleInteractionLimit("mayor", playerCount)?.amount, expected);
    assert.equal(getRoleInteractionLimit("medium", playerCount)?.amount, expected);
  }

  assert.equal(getRoleInteractionLimit("vigilante", 9)?.amount, 1);
  assert.equal(getRoleInteractionLimit("vigilante", 10)?.amount, 2);
  assert.equal(getRoleInteractionLimit("vigilante", 15)?.amount, 3);
});

test("returns player-facing descriptions with correct singular and plural", () => {
  assert.match(
    getRoleInteractionLimit("vigilante", 9)?.description ?? "",
    /1 vez durante toda a partida/,
  );
  assert.match(
    getRoleInteractionLimit("janitor", 15)?.description ?? "",
    /4 vítimas mortas pela Mafia/,
  );
});

test("does not invent a calculated limit for an unlimited role", () => {
  assert.equal(getRoleInteractionLimit("sheriff", 12), null);
  assert.equal(getRoleInteractionLimit("investigator", 0), null);
});
