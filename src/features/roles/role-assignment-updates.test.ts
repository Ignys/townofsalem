import assert from "node:assert/strict";
import test from "node:test";

import { firebasePaths } from "@/lib/firebase/paths";

import { createRoleAssignmentUpdates } from "./role-assignment-updates";

test("builds one atomic private assignment per player", () => {
  const gameId = "game-1";
  const updates = createRoleAssignmentUpdates(
    gameId,
    {
      "player-1": "doctor",
      "player-2": "mafioso",
    },
    1234,
    { phaseSessionId: "phase-night-1", nightId: "night-1-id" },
  );

  assert.deepEqual(updates[firebasePaths.gamePrivatePlayer(gameId, "player-1")], {
    roleId: "doctor",
    originalRoleId: "doctor",
    faction: "town",
  });
  assert.deepEqual(updates[firebasePaths.gamePrivatePlayer(gameId, "player-2")], {
    roleId: "mafioso",
    originalRoleId: "mafioso",
    faction: "mafia",
  });
  assert.equal(
    updates[firebasePaths.gamePublicField(gameId, "status")],
    "in-progress",
  );
  assert.equal(updates[firebasePaths.gamePublicField(gameId, "phase")], "night");
  assert.equal(updates[firebasePaths.gamePublicField(gameId, "nightNumber")], 1);
  assert.equal(updates[firebasePaths.gamePublicField(gameId, "phaseEndsAt")], null);
  assert.deepEqual(updates[firebasePaths.gameNightSession(gameId, "night-1-id")], {
    id: "night-1-id",
    phaseSessionId: "phase-night-1",
    nightNumber: 1,
    startedAt: 1234,
  });
  assert.equal(
    updates[firebasePaths.gameSettingsField(gameId, "rolesAssignedAt")],
    1234,
  );
});

test("never writes a role under the public players branch", () => {
  const updates = createRoleAssignmentUpdates(
    "game-1",
    { "player-1": "doctor" },
    1234,
    { phaseSessionId: "phase-night-1", nightId: "night-1-id" },
  );

  assert.equal(
    Object.keys(updates).some((path) => path.includes("/players/")),
    false,
  );
});

test("rejects an assignment with an unknown catalog role", () => {
  assert.throws(
    () =>
      createRoleAssignmentUpdates(
        "game-1",
        { "player-1": "invented-role" },
        1234,
        { phaseSessionId: "phase-night-1", nightId: "night-1-id" },
      ),
    /unknown catalog ID/,
  );
});
