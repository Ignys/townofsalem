import assert from "node:assert/strict";
import test from "node:test";

import { drawRoles, DrawRolesError, type RandomSource } from "./draw-roles";

function sequenceRandom(values: readonly number[]): RandomSource {
  let index = 0;

  return () => {
    const value = values[index];
    index += 1;

    if (value === undefined) {
      throw new Error("The deterministic random sequence was exhausted.");
    }

    return value;
  };
}

test("assigns exactly one selected role to every participant", () => {
  const assignments = drawRoles(
    ["player-1", "player-2", "player-3"],
    ["doctor", "sheriff", "mafioso"],
    sequenceRandom([0.25, 0.75, 0.5, 0]),
  );

  assert.equal(Object.keys(assignments).length, 3);
  assert.deepEqual(Object.keys(assignments).sort(), [
    "player-1",
    "player-2",
    "player-3",
  ]);
  assert.deepEqual(Object.values(assignments).sort(), [
    "doctor",
    "mafioso",
    "sheriff",
  ]);
});

test("produces deterministic assignments with an injected random source", () => {
  const assignments = drawRoles(
    ["player-1", "player-2", "player-3"],
    ["doctor", "sheriff", "mafioso"],
    sequenceRandom([0, 0.9, 0.5, 0]),
  );

  assert.deepEqual(assignments, {
    "player-3": "mafioso",
    "player-2": "doctor",
    "player-1": "sheriff",
  });
});

test("does not mutate player or role arrays", () => {
  const playerUids = Object.freeze(["player-1", "player-2"]);
  const roleIds = Object.freeze(["doctor", "sheriff"]);

  drawRoles(playerUids, roleIds, sequenceRandom([0, 0]));

  assert.deepEqual(playerUids, ["player-1", "player-2"]);
  assert.deepEqual(roleIds, ["doctor", "sheriff"]);
});

test("preserves every occurrence when a validated composition has copies", () => {
  const assignments = drawRoles(
    ["player-1", "player-2", "player-3"],
    ["doctor", "doctor", "sheriff"],
    sequenceRandom([0, 0, 0, 0]),
  );

  assert.deepEqual(Object.values(assignments).sort(), [
    "doctor",
    "doctor",
    "sheriff",
  ]);
});

test("rejects different participant and role counts", () => {
  assert.throws(
    () => drawRoles(["player-1", "player-2"], ["doctor"]),
    (error: unknown) =>
      error instanceof DrawRolesError &&
      error.code === "participant-role-count-mismatch",
  );
});

test("rejects duplicate participant UIDs", () => {
  assert.throws(
    () =>
      drawRoles(
        ["player-1", "player-1"],
        ["doctor", "sheriff"],
      ),
    (error: unknown) =>
      error instanceof DrawRolesError && error.code === "duplicate-player-uid",
  );
});

test("rejects values outside the random source contract", () => {
  assert.throws(
    () =>
      drawRoles(
        ["player-1", "player-2"],
        ["doctor", "sheriff"],
        () => 1,
      ),
    (error: unknown) =>
      error instanceof DrawRolesError && error.code === "invalid-random-value",
  );
});

test("returns an empty assignment map for two empty validated lists", () => {
  assert.deepEqual(drawRoles([], []), {});
});
