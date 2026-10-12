import assert from "node:assert/strict";
import test from "node:test";

import { ROLE_DEFINITIONS } from "@/data/roles";
import type { Player } from "@/types";

import {
  getPlayerNightInteractions,
  getPlayerNightTargets,
} from "./player-night-interactions";

function player(uid: string, overrides: Partial<Player> = {}): Player {
  return {
    id: uid,
    uid,
    name: uid,
    alive: true,
    disconnected: false,
    experience: "beginner",
    ...overrides,
  };
}

const viewer = player("viewer");
const roster = [viewer, player("maria"), player("joao")];

function actionIds(roleId: string, nightNumber: number): string[] {
  return getPlayerNightInteractions(viewer, roleId, ROLE_DEFINITIONS, nightNumber)
    .map(({ action }) => action.id);
}

test("sheriff can act on night 1", () => {
  assert.ok(actionIds("sheriff", 1).length > 0);
});

test("vigilante cannot shoot on night 1 but can from night 2", () => {
  assert.deepEqual(actionIds("vigilante", 1), []);
  assert.ok(actionIds("vigilante", 2).includes("shoot"));
});

test("deputy is excluded from the player night panel", () => {
  assert.deepEqual(actionIds("deputy", 2), []);
});

test("a dead player gets no interactions", () => {
  const dead = player("viewer", { alive: false });
  assert.deepEqual(
    getPlayerNightInteractions(dead, "sheriff", ROLE_DEFINITIONS, 2),
    [],
  );
});

test("a role that does not wake at night gets no interactions", () => {
  assert.deepEqual(actionIds("townie", 2), []);
});

test("a lone godfather still sees a single target on the player side", () => {
  // O cliente do jogador não consegue contar a máfia viva, então a variante de
  // duplo abate é sempre desligada aqui; o host completa o 2o alvo.
  const interactions = getPlayerNightInteractions(
    viewer,
    "godfather",
    ROLE_DEFINITIONS,
    2,
    { godfatherDoubleKillWhenLastMafia: true },
  );
  const kill = interactions.find(({ action }) => action.id === "mafia-kill-vote");
  assert.ok(kill);
  assert.notEqual(kill?.action.targetCount, 2);
});

test("targets exclude the actor unless self-target is allowed", () => {
  const [interaction] = getPlayerNightInteractions(viewer, "sheriff", ROLE_DEFINITIONS, 1);
  const targets = getPlayerNightTargets(interaction, roster).map(({ uid }) => uid);
  assert.deepEqual(targets, ["maria", "joao"]);
});

test("targets exclude dead players", () => {
  const [interaction] = getPlayerNightInteractions(viewer, "sheriff", ROLE_DEFINITIONS, 1);
  const targets = getPlayerNightTargets(interaction, [
    viewer,
    player("maria", { alive: false }),
    player("joao"),
  ]).map(({ uid }) => uid);
  assert.deepEqual(targets, ["joao"]);
});
