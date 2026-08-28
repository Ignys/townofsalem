import assert from "node:assert/strict";
import test from "node:test";

import type { NightResolution } from "@/game-engine/types";
import type { StoredGameEvent } from "@/lib/firebase/schema";
import type { NightResolutionRecord } from "@/types";

import { getPlayerDeathDetailsByUid } from "./player-death-details";

const baseResolution: NightResolution = {
  nightId: "night-1",
  deaths: [],
  survivors: [],
  investigationResults: [],
  appliedEffects: [],
  blockedActions: [],
  failedActions: [],
  warnings: [],
  engineEvents: [],
  cleanedPlayerUids: [],
  partial: false,
};

function resolutionRecord(resolution: NightResolution): NightResolutionRecord {
  return {
    id: "resolution",
    nightId: resolution.nightId,
    actionsRevision: 1,
    createdAt: 100,
    appliedAt: 110,
    resolution,
    playerAliveBefore: {},
    cleanStatusBefore: {},
  };
}

test("describes the Mafia member selected as the Bodyguard attacker", () => {
  const details = getPlayerDeathDetailsByUid({
    resolutions: {
      "night-1": resolutionRecord({
        ...baseResolution,
        deaths: ["bodyguard"],
        deathRecords: [{
          targetUid: "bodyguard",
          attackerUid: "godfather",
          cause: "bodyguard-sacrifice",
          originalTargetUid: "protected",
          originalAttackCause: "mafia-attack",
        }],
      }),
    },
    events: {},
    playerNames: { godfather: "Don", protected: "Pinky" },
  });

  assert.equal(details.bodyguard.attackerUid, "godfather");
  assert.equal(
    details.bodyguard.description,
    "Morreu para Don pela Mafia protegendo Pinky.",
  );
  assert.equal(details.bodyguard.originalTargetUid, "protected");
});

test("describes the Mafia member killed while attacking the protected player", () => {
  const details = getPlayerDeathDetailsByUid({
    resolutions: {
      "night-1": resolutionRecord({
        ...baseResolution,
        deaths: ["godfather"],
        deathRecords: [{
          targetUid: "godfather",
          attackerUid: "bodyguard",
          cause: "bodyguard-counterattack",
          originalTargetUid: "protected",
        }],
      }),
    },
    events: {},
    playerNames: { bodyguard: "Bruno", protected: "Pinky" },
  });

  assert.equal(
    details.godfather.description,
    "Morreu para Bruno atacando Pinky.",
  );
});

test("describes day deaths and administrative overrides", () => {
  const events = {
    day: {
      type: "DAY_RESOLUTION_APPLIED",
      timestamp: 200,
      payload: {
        accusedPlayerUid: "accused",
        deaths: [
          { targetUid: "accused", cause: "hanging" },
          { targetUid: "guilty-voter", cause: "jester-revenge" },
        ],
        individualWinnerUids: [],
      },
    },
    manual: {
      type: "PLAYER_DIED",
      timestamp: 300,
      payload: { playerUid: "manual", source: "administrative-override" },
    },
  } as unknown as Record<string, StoredGameEvent>;
  const details = getPlayerDeathDetailsByUid({
    resolutions: {},
    events,
    playerNames: { accused: "Júlia" },
  });

  assert.match(details.accused.description, /enforcamento/);
  assert.equal(
    details["guilty-voter"].description,
    "Morreu para Júlia pela vingança do Jester.",
  );
  assert.match(details.manual.description, /manualmente/);
});
