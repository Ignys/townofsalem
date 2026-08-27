import assert from "node:assert/strict";
import test from "node:test";

import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";
import type { Player } from "@/types";

import {
  getAvailableNightTargets,
  getLatestNightConsoleEntry,
  getNightConsoleInteractions,
} from "./night-console-interactions";

const players: Player[] = [
  {
    id: "daniel",
    uid: "daniel",
    name: "Daniel",
    alive: true,
    disconnected: false,
    experience: "beginner",
  },
  {
    id: "maria",
    uid: "maria",
    name: "Maria",
    alive: true,
    disconnected: false,
    experience: "beginner",
  },
  {
    id: "joao",
    uid: "joao",
    name: "João",
    alive: true,
    disconnected: false,
    experience: "beginner",
  },
];

test("creates one console row for each available night action", () => {
  const interactions = getNightConsoleInteractions(
    players,
    { daniel: "doctor", maria: "blackmailer", joao: "godfather" },
    ROLE_DEFINITIONS,
    2,
  );

  assert.deepEqual(
    interactions.map(({ actor, role, action }) => [actor.name, role.id, action.verb]),
    [
      ["Daniel", "doctor", "cura"],
      ["Maria", "blackmailer", "silencia"],
      ["João", "godfather", "manda atacar"],
      ["Maria", "blackmailer", "manda atacar"],
    ],
  );
});

test("uses each action definition to filter valid targets", () => {
  const doctor = getRoleById("doctor");
  assert.ok(doctor?.actionDefinitions?.[0]);

  const interaction = {
    id: "daniel:protect",
    actor: players[0],
    role: doctor,
    action: doctor.actionDefinitions[0],
  };

  assert.deepEqual(
    getAvailableNightTargets(interaction, players).map(({ uid }) => uid),
    ["maria", "joao"],
  );
});

test("selects the latest persisted entry for a console interaction", () => {
  const doctor = getRoleById("doctor");
  assert.ok(doctor?.actionDefinitions?.[0]);
  const interaction = {
    id: "daniel:protect",
    actor: players[0],
    role: doctor,
    action: doctor.actionDefinitions[0],
  };
  const baseEntry = {
    id: "old",
    nightId: "night-1",
    actorUid: "daniel",
    roleIdSnapshot: "doctor",
    actionId: "protect",
    targetUids: ["maria"],
    createdAt: 1,
    updatedAt: 1,
    status: "confirmed" as const,
  };

  assert.equal(
    getLatestNightConsoleEntry(interaction, [
      baseEntry,
      { ...baseEntry, id: "new", targetUids: ["joao"], updatedAt: 2 },
      { ...baseEntry, id: "other", actorUid: "maria", updatedAt: 3 },
    ])?.id,
    "new",
  );
});

test("last Godfather receives two targets only when its variant is enabled", () => {
  const interactions = getNightConsoleInteractions(
    players.slice(0, 2),
    { daniel: "godfather", maria: "doctor" },
    ROLE_DEFINITIONS,
    2,
    { godfatherDoubleKillWhenLastMafia: true },
  );
  const mafiaAttack = interactions.find(({ action }) => action.id === "mafia-kill-vote");
  assert.equal(mafiaAttack?.action.targetCount, 2);
});
