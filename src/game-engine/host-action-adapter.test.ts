import assert from "node:assert/strict";
import test from "node:test";

import { ROLE_DEFINITIONS } from "@/data/roles";
import type { HostNightActionEntry } from "@/types";
import { adaptHostActions } from "./host-action-adapter";

function mafiaVote(
  id: string,
  actorUid: string,
  roleIdSnapshot: string,
  targetUid: string,
): HostNightActionEntry {
  return {
    id,
    nightId: "night-2",
    actorUid,
    roleIdSnapshot,
    actionId: "mafia-kill-vote",
    targetUids: [targetUid],
    createdAt: 1,
    updatedAt: 1,
    status: "confirmed",
  };
}

test("turns Mafia votes into one collective attack", () => {
  const result = adaptHostActions(
    [
      mafiaVote("a", "godfather", "godfather", "target"),
      mafiaVote("b", "mafioso", "mafioso", "target"),
    ],
    ROLE_DEFINITIONS,
  );

  assert.equal(result.warnings.length, 0);
  assert.equal(result.actions.length, 1);
  assert.equal(result.actions[0].actionId, "mafia-attack");
  assert.deepEqual(result.actions[0].targetUids, ["target"]);
});

test("uses the Godfather vote to break an internal tie", () => {
  const result = adaptHostActions(
    [
      mafiaVote("a", "godfather", "godfather", "first"),
      mafiaVote("b", "mafioso", "mafioso", "second"),
    ],
    ROLE_DEFINITIONS,
  );

  assert.deepEqual(result.actions[0].targetUids, ["first"]);
});
