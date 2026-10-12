import assert from "node:assert/strict";
import test from "node:test";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { getNightConsoleInteractions } from "@/features/lobby/night-console-interactions";
import type { HostNightActionEntry, Player, PlayerNightActionSubmission } from "@/types";

import {
  buildMirrorPlan,
  getMirroredEntryId,
  type PlayerSubmissionRecord,
} from "./mirror-player-night-action";

function player(uid: string, overrides: Partial<Player> = {}): Player {
  return {
    id: uid,
    uid,
    name: uid,
    alive: true,
    disconnected: false,
    experience: "beginner",
    statuses: [],
    ...overrides,
  };
}

const players = [player("sheriff"), player("maria"), player("joao")];
const assignments = { sheriff: "sheriff", maria: "doctor", joao: "mafioso" };
const NIGHT_ID = "night-1";
const NIGHT_NUMBER = 2;

const context = {
  players,
  assignments,
  roleDefinitions: ROLE_DEFINITIONS,
  nightId: NIGHT_ID,
  nightNumber: NIGHT_NUMBER,
  actionEntries: [],
};

const interactions = getNightConsoleInteractions(
  players,
  assignments,
  ROLE_DEFINITIONS,
  NIGHT_NUMBER,
);

function submission(
  actionId: string,
  targetUids: string[],
  overrides: Partial<PlayerNightActionSubmission> = {},
): PlayerSubmissionRecord {
  return {
    actorUid: "sheriff",
    submission: {
      nightId: NIGHT_ID,
      nightNumber: NIGHT_NUMBER,
      actionId,
      roleIdSnapshot: "sheriff",
      targetUids,
      createdAt: 10,
      updatedAt: 10,
      ...overrides,
    },
  };
}

const sheriffActionId = interactions.find(({ actor }) => actor.uid === "sheriff")!.action.id;

test("a fresh submission becomes a confirmed entry with a deterministic id", () => {
  const plan = buildMirrorPlan(
    [submission(sheriffActionId, ["maria"])],
    interactions,
    [],
    context,
    100,
  );
  assert.equal(plan.entries.length, 1);
  const [entry] = plan.entries;
  assert.equal(entry.id, getMirroredEntryId("sheriff", sheriffActionId));
  assert.equal(entry.status, "confirmed");
  assert.equal(entry.source, "player");
  assert.equal(entry.sourceUpdatedAt, 10);
  assert.deepEqual(entry.targetUids, ["maria"]);
});

test("an unchanged submission is skipped", () => {
  const record = submission(sheriffActionId, ["maria"]);
  const [entry] = buildMirrorPlan([record], interactions, [], context, 100).entries;
  const plan = buildMirrorPlan([record], interactions, [entry], context, 200);
  assert.deepEqual(plan.entries, []);
  assert.equal(plan.skipped[0].reason, "unchanged");
});

test("a host override wins over an unchanged submission", () => {
  const record = submission(sheriffActionId, ["maria"]);
  const [mirrored] = buildMirrorPlan([record], interactions, [], context, 100).entries;
  const overridden: HostNightActionEntry = {
    ...mirrored,
    targetUids: ["joao"],
    source: "host",
    overriddenAt: 50,
  };
  const plan = buildMirrorPlan([record], interactions, [overridden], context, 200);
  assert.deepEqual(plan.entries, []);
  assert.equal(plan.skipped[0].reason, "host-override");
});

test("a newer submission overrides a host override", () => {
  const record = submission(sheriffActionId, ["joao"], { updatedAt: 90 });
  const overridden: HostNightActionEntry = {
    id: getMirroredEntryId("sheriff", sheriffActionId),
    nightId: NIGHT_ID,
    actorUid: "sheriff",
    roleIdSnapshot: "sheriff",
    actionId: sheriffActionId,
    targetUids: ["maria"],
    createdAt: 10,
    updatedAt: 50,
    status: "confirmed",
    source: "host",
    overriddenAt: 50,
  };
  const plan = buildMirrorPlan([record], interactions, [overridden], context, 200);
  assert.equal(plan.entries.length, 1);
  assert.deepEqual(plan.entries[0].targetUids, ["joao"]);
  assert.equal(plan.entries[0].createdAt, 10, "preserva o createdAt original");
});

test("a submission with no matching interaction is dropped", () => {
  const plan = buildMirrorPlan(
    [submission("nao-existe", ["maria"])],
    interactions,
    [],
    context,
    100,
  );
  assert.deepEqual(plan.entries, []);
  assert.equal(plan.skipped[0].reason, "no-matching-interaction");
});

test("a submission that fails validation is mirrored as a draft", () => {
  const plan = buildMirrorPlan(
    [submission(sheriffActionId, [])],
    interactions,
    [],
    context,
    100,
  );
  assert.equal(plan.entries.length, 1);
  assert.equal(plan.entries[0].status, "draft");
});

test("a lone godfather submitting one target becomes a draft for the host to complete", () => {
  const mafiaPlayers = [player("gf"), player("maria"), player("joao")];
  const mafiaAssignments = { gf: "godfather", maria: "doctor", joao: "sheriff" };
  const variants = { godfatherDoubleKillWhenLastMafia: true };
  const hostInteractions = getNightConsoleInteractions(
    mafiaPlayers,
    mafiaAssignments,
    ROLE_DEFINITIONS,
    NIGHT_NUMBER,
    variants,
  );
  const kill = hostInteractions.find(({ action }) => action.id === "mafia-kill-vote");
  assert.equal(kill?.action.targetCount, 2, "host enxerga o godfather sozinho");

  const plan = buildMirrorPlan(
    [{
      actorUid: "gf",
      submission: {
        nightId: NIGHT_ID,
        nightNumber: NIGHT_NUMBER,
        actionId: "mafia-kill-vote",
        roleIdSnapshot: "godfather",
        targetUids: ["maria"],
        createdAt: 10,
        updatedAt: 10,
      },
    }],
    hostInteractions,
    [],
    {
      players: mafiaPlayers,
      assignments: mafiaAssignments,
      roleDefinitions: ROLE_DEFINITIONS,
      nightId: NIGHT_ID,
      nightNumber: NIGHT_NUMBER,
      actionEntries: [],
      variants,
    },
    100,
  );
  assert.equal(plan.entries.length, 1);
  assert.equal(plan.entries[0].status, "draft");
});
