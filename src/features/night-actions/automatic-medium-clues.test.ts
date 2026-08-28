import assert from "node:assert/strict";
import test from "node:test";

import type { NightResolution } from "@/game-engine/types";
import type { HostNightActionEntry, NightResolutionRecord } from "@/types";

import { addAutomaticMediumClues } from "./automatic-medium-clues";

const emptyResolution: NightResolution = {
  nightId: "night-2",
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

function mediumAction(victimUid = "victim"): HostNightActionEntry {
  return {
    id: "medium-action",
    nightId: "night-2",
    nightNumber: 2,
    actorUid: "medium",
    roleIdSnapshot: "medium",
    actionId: "seance",
    targetUids: [victimUid],
    createdAt: 200,
    updatedAt: 200,
    status: "confirmed",
  };
}

function previousResolution(resolution: NightResolution): NightResolutionRecord {
  return {
    id: "night-1-resolution",
    nightId: "night-1",
    actionsRevision: 1,
    createdAt: 100,
    appliedAt: 110,
    resolution,
    playerAliveBefore: {},
    cleanStatusBefore: {},
  };
}

test("automatically creates a Medium clue from the recorded attacker", () => {
  const result = addAutomaticMediumClues({
    gameId: "game",
    nightId: "night-2",
    playerUids: ["medium", "victim", "killer", "other"],
    entries: [mediumAction()],
    previousResolutions: {
      "night-1": previousResolution({
        ...emptyResolution,
        nightId: "night-1",
        deaths: ["victim"],
        deathRecords: [{
          targetUid: "victim",
          attackerUid: "killer",
          cause: "night-attack",
        }],
      }),
    },
    resolution: emptyResolution,
  });

  assert.equal(result.mediumClues?.[0].mediumUid, "medium");
  assert.equal(result.mediumClues?.[0].victimUid, "victim");
  assert.equal(result.mediumClues?.[0].responsiblePlayerUid, "killer");
  assert.equal(result.mediumClues?.[0].candidateCount, 2);
  assert.equal(result.mediumClues?.[0].candidateUids.length, 2);
  assert.ok(result.mediumClues?.[0].candidateUids.includes("killer"));
  assert.ok(!result.mediumClues?.[0].candidateUids.includes("victim"));
});

test("uses the game-size tier and automatically chooses a Mafia representative", () => {
  const playerUids = [
    "medium", "victim", "mafioso", "godfather", "p1",
    "p2", "p3", "p4", "p5", "p6",
  ];
  const mafiaEffect = {
    id: "mafia-attack:vote",
    actorUid: "godfather",
    roleId: "godfather",
    actionId: "mafia-attack",
    targetUids: ["victim"],
    effectType: "attack" as const,
    priority: 50,
    sourceType: "faction" as const,
    sourceFaction: "mafia" as const,
    participantUids: ["godfather", "mafioso"],
  };
  const result = addAutomaticMediumClues({
    gameId: "game",
    nightId: "night-2",
    playerUids,
    entries: [mediumAction()],
    previousResolutions: {
      "night-1": previousResolution({
        ...emptyResolution,
        nightId: "night-1",
        deaths: ["victim"],
        deathRecords: [{
          targetUid: "victim",
          cause: "mafia-attack",
          sourceActionId: mafiaEffect.id,
        }],
        appliedEffects: [mafiaEffect],
      }),
    },
    resolution: emptyResolution,
  });

  const clue = result.mediumClues?.[0];
  assert.equal(clue?.candidateCount, 3);
  assert.equal(clue?.candidateUids.length, 3);
  assert.ok(["godfather", "mafioso"].includes(clue?.responsiblePlayerUid ?? ""));
  assert.ok(clue?.candidateUids.includes(clue.responsiblePlayerUid));
  assert.ok(result.randomDecisions?.some(({ key }) => key.endsWith(":responsible")));
});

test("generates the same clue whenever the preview is recalculated", () => {
  const input = {
    gameId: "game",
    nightId: "night-2",
    playerUids: ["medium", "victim", "killer", "a", "b"],
    entries: [mediumAction()],
    previousResolutions: {
      "night-1": previousResolution({
        ...emptyResolution,
        nightId: "night-1",
        deaths: ["victim"],
        deathRecords: [{ targetUid: "victim", attackerUid: "killer", cause: "night-attack" as const }],
      }),
    },
    resolution: emptyResolution,
  };

  assert.deepEqual(
    addAutomaticMediumClues(input).mediumClues,
    addAutomaticMediumClues(input).mediumClues,
  );
});
