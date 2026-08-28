import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_GAME_VARIANTS } from "@/game-engine/variants";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";
import type { HostNightActionEntry, Player } from "@/types";

import {
  calculateNightResolutionPreview,
  getNightResolutionPreviewEpoch,
} from "./calculate-night-resolution-preview";

const players: Player[] = [
  {
    id: "doctor",
    uid: "doctor",
    name: "Pinky",
    alive: true,
    disconnected: false,
    experience: "experienced",
  },
  {
    id: "target",
    uid: "target",
    name: "Clyde",
    alive: true,
    disconnected: false,
    experience: "experienced",
  },
];

const privatePlayers: Record<string, PrivatePlayerRecord> = {
  doctor: { roleId: "doctor", faction: "town" },
  target: { roleId: "townie", faction: "town" },
};

function action(targetUids: readonly string[]): HostNightActionEntry {
  return {
    id: "protect",
    nightId: "night-1",
    nightNumber: 1,
    actorUid: "doctor",
    roleIdSnapshot: "doctor",
    actionId: "protect",
    targetUids,
    createdAt: 100,
    updatedAt: 200,
    status: "confirmed",
  };
}

test("recalculates the automatic preview from the latest confirmed actions", () => {
  const entries = [action(["target"])];
  const calculation = calculateNightResolutionPreview({
    gameId: "game",
    nightId: "night-1",
    nightNumber: 1,
    actionsRevision: 3,
    previewEpoch: 200,
    players,
    assignments: { doctor: "doctor", target: "townie" },
    privatePlayers,
    entries,
    actionHistory: entries,
    variants: { ...DEFAULT_GAME_VARIANTS },
    amnesiacRolePool: [],
  });

  assert.equal(calculation.validationIssues.length, 0);
  assert.equal(calculation.preview?.id, "night-1-3-200");
  assert.deepEqual(calculation.preview?.resolution.appliedEffects[0].targetUids, [
    "target",
  ]);
});

test("withholds the automatic preview while a confirmed action is invalid", () => {
  const entries = [action([])];
  const calculation = calculateNightResolutionPreview({
    gameId: "game",
    nightId: "night-1",
    nightNumber: 1,
    actionsRevision: 4,
    previewEpoch: 200,
    players,
    assignments: { doctor: "doctor", target: "townie" },
    privatePlayers,
    entries,
    actionHistory: entries,
    variants: { ...DEFAULT_GAME_VARIANTS },
    amnesiacRolePool: [],
  });

  assert.equal(calculation.preview, null);
  assert.ok(calculation.validationIssues.some(({ code }) => code === "TARGET_COUNT"));
});

test("uses the latest night change as the stable preview epoch", () => {
  assert.equal(getNightResolutionPreviewEpoch(50, 150, [action(["target"])]), 200);
});
