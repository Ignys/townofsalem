import assert from "node:assert/strict";
import test from "node:test";

import { ROLE_DEFINITIONS } from "@/data/roles";
import type { HostNightActionEntry } from "@/types";

import { getPlayerInteractionHistory } from "./player-interaction-history";

function action(
  overrides: Partial<HostNightActionEntry> = {},
): HostNightActionEntry {
  return {
    id: "doctor-night-2",
    nightId: "night-b",
    actorUid: "doctor",
    roleIdSnapshot: "doctor",
    actionId: "protect",
    targetUids: ["target"],
    createdAt: 20,
    updatedAt: 20,
    status: "confirmed",
    ...overrides,
  };
}

test("groups the player's recorded interactions by night with pragmatic wording", () => {
  const groups = getPlayerInteractionHistory({
    actionEntries: [
      action(),
      action({
        id: "doctor-night-1",
        nightId: "night-a",
        nightNumber: 1,
        createdAt: 10,
        updatedAt: 10,
        targetUids: ["doctor"],
      }),
      action({ id: "another-player", actorUid: "other" }),
      action({ id: "cancelled", status: "cancelled" }),
    ],
    playerUid: "doctor",
    playerNames: { doctor: "Maria", target: "João" },
    nightNumberById: { "night-b": 2 },
    roleDefinitions: ROLE_DEFINITIONS,
  });

  assert.deepEqual(groups, [
    {
      nightId: "night-a",
      nightNumber: 1,
      interactions: [{
        id: "doctor-night-1",
        description: "Curou Maria.",
        notes: undefined,
        status: "confirmed",
      }],
    },
    {
      nightId: "night-b",
      nightNumber: 2,
      interactions: [{
        id: "doctor-night-2",
        description: "Curou João.",
        notes: undefined,
        status: "confirmed",
      }],
    },
  ]);
});

test("keeps incomplete drafts visible and explicit", () => {
  const groups = getPlayerInteractionHistory({
    actionEntries: [action({ status: "draft", targetUids: [] })],
    playerUid: "doctor",
    playerNames: {},
    nightNumberById: { "night-b": 2 },
    roleDefinitions: ROLE_DEFINITIONS,
  });

  assert.equal(groups[0]?.interactions[0]?.description, "Curou alvo pendente.");
  assert.equal(groups[0]?.interactions[0]?.status, "draft");
});
