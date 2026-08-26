import assert from "node:assert/strict";
import test from "node:test";

import type { Player, RoleDefinition } from "@/types";

import { generateNightWakePlan } from "./night-wake-plan";

const players: Player[] = [
  { id: "a", uid: "a", name: "Ana", alive: true, disconnected: false, experience: "beginner" },
  { id: "b", uid: "b", name: "Beto", alive: true, disconnected: false, experience: "experienced" },
  { id: "c", uid: "c", name: "Caio", alive: false, disconnected: false, experience: "experienced" },
  { id: "d", uid: "d", name: "Dora", alive: true, disconnected: false, experience: "experienced" },
];

function role(overrides: Partial<RoleDefinition> & Pick<RoleDefinition, "id" | "name">): RoleDefinition {
  return {
    faction: "town",
    alignment: "fixture",
    description: "fixture",
    goal: "fixture",
    canDieAtNight: true,
    verificationStatus: "verified",
    ...overrides,
    virtueValue: overrides.virtueValue ?? 0,
    cardCount: overrides.cardCount ?? 1,
    importantInteractions: overrides.importantInteractions ?? [],
  };
}

const roles = [
  role({ id: "day", name: "Diurna", wakesAtNight: false }),
  role({ id: "early", name: "Primeira", wakesAtNight: true, wakeOrder: 10 }),
  role({ id: "mafia-a", name: "Mafioso", faction: "mafia", wakesAtNight: true, wakeOrder: 20, wakeGroupId: "fixture-faction", wakeGroupLabel: "Grupo da fixture" }),
  role({ id: "mafia-b", name: "Conselheiro", faction: "mafia", wakesAtNight: true, wakeOrder: 20, wakeGroupId: "fixture-faction", wakeGroupLabel: "Grupo da fixture" }),
];

test("ignores daytime roles and dead players by default", () => {
  const result = generateNightWakePlan(players, [
    { playerUid: "a", roleId: "day" },
    { playerUid: "b", roleId: "early" },
    { playerUid: "c", roleId: "early" },
  ], roles);

  assert.deepEqual(result.map(({ members }) => members.map(({ playerUid }) => playerUid)), [["b"]]);
});

test("groups roles exclusively from wake metadata and remains deterministic", () => {
  const assignments = [
    { playerUid: "d", roleId: "mafia-b" },
    { playerUid: "a", roleId: "mafia-a" },
    { playerUid: "b", roleId: "early" },
  ];
  const first = generateNightWakePlan(players, assignments, roles);
  const second = generateNightWakePlan([...players].reverse(), [...assignments].reverse(), roles);

  assert.deepEqual(first, second);
  assert.equal(first[0].members[0].playerUid, "b");
  assert.equal(first[1].label, "Grupo da fixture");
  assert.deepEqual(first[1].members.map(({ playerUid }) => playerUid), ["a", "d"]);
});
