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
  );

  assert.deepEqual(updates[firebasePaths.gamePrivatePlayer(gameId, "player-1")], {
    roleId: "doctor",
    faction: "town",
  });
  assert.deepEqual(updates[firebasePaths.gamePrivatePlayer(gameId, "player-2")], {
    roleId: "mafioso",
    faction: "mafia",
  });
  assert.equal(
    updates[firebasePaths.gamePublicField(gameId, "status")],
    "in-progress",
  );
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
      ),
    /unknown catalog ID/,
  );
});
