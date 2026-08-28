import assert from "node:assert/strict";
import test from "node:test";

import type { HostNightActionEntry } from "@/types";

import { getRoleResourceUsage } from "./role-resource-usage";

function action(
  overrides: Partial<HostNightActionEntry> = {},
): HostNightActionEntry {
  return {
    id: crypto.randomUUID(),
    nightId: "night-1",
    actorUid: "player-1",
    roleIdSnapshot: "vigilante",
    actionId: "shoot",
    targetUids: ["target"],
    createdAt: 1,
    updatedAt: 1,
    status: "confirmed",
    ...overrides,
  };
}

test("counts confirmed role actions across the night history", () => {
  const usage = getRoleResourceUsage({
    roleId: "vigilante",
    playerUid: "player-1",
    playerCount: 10,
    actionEntries: [
      action(),
      action({ id: "draft", status: "draft" }),
      action({ id: "other-player", actorUid: "player-2" }),
      action({ id: "other-action", actionId: "protect" }),
    ],
  });

  assert.deepEqual(usage, {
    label: "tiros",
    limit: 2,
    used: 1,
    remaining: 1,
  });
});

test("matches validation by retaining uses of the same action after a role change", () => {
  const usage = getRoleResourceUsage({
    roleId: "consigliere",
    playerUid: "player-1",
    playerCount: 10,
    actionEntries: [
      action({ roleIdSnapshot: "investigator", actionId: "investigate-exact-role" }),
    ],
  });

  assert.equal(usage?.used, 1);
  assert.equal(usage?.remaining, 2);
});

test("reads Janitor usage from persisted consumed resources", () => {
  const usage = getRoleResourceUsage({
    roleId: "janitor",
    playerUid: "player-1",
    playerCount: 15,
    actionEntries: [],
    assignment: {
      roleId: "janitor",
      faction: "mafia",
      resourceUses: { janitor: 3 },
    },
  });

  assert.deepEqual(usage, {
    label: "limpezas",
    limit: 4,
    used: 3,
    remaining: 1,
  });
});

test("does not treat Mayor vote weight or Medium candidates as consumable uses", () => {
  assert.equal(
    getRoleResourceUsage({
      roleId: "mayor",
      playerUid: "player-1",
      playerCount: 10,
      actionEntries: [],
    }),
    null,
  );
  assert.equal(
    getRoleResourceUsage({
      roleId: "medium",
      playerUid: "player-1",
      playerCount: 10,
      actionEntries: [],
    }),
    null,
  );
});
