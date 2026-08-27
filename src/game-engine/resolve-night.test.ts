import assert from "node:assert/strict";
import test from "node:test";

import { resolveNight } from "./resolve-night";
import type { EngineGameState, EngineNightAction } from "./types";

const game: EngineGameState = {
  gameId: "game", nightId: "night", players: [
    { uid: "attacker", name: "Atacante", alive: true, roleId: "a", faction: "mafia", canDieAtNight: true, statuses: [] },
    { uid: "protector", name: "Protetor", alive: true, roleId: "p", faction: "town", canDieAtNight: true, statuses: [] },
    { uid: "target", name: "Alvo", alive: true, roleId: "t", faction: "town", canDieAtNight: true, statuses: [], investigativeAppearance: { sheriff: "INOCENTE" } },
    { uid: "blocker", name: "Bloqueador", alive: true, roleId: "b", faction: "town", canDieAtNight: true, statuses: [] },
    { uid: "immune", name: "Imune", alive: true, roleId: "i", faction: "neutral", canDieAtNight: false, statuses: [] },
  ],
};

function action(overrides: Partial<EngineNightAction> & Pick<EngineNightAction, "id" | "actorUid" | "targetUids">): EngineNightAction {
  return { roleId: "fixture", actionId: overrides.id, ...overrides };
}

test("an unprotected night kill eliminates a role that can die at night", () => {
  const result = resolveNight(game, [
    action({ id: "kill", actorUid: "attacker", targetUids: ["target"], effectType: "attack", priority: 50 }),
  ]);

  assert.deepEqual(result.deaths, ["target"]);
  assert.equal(result.partial, false);
});

test("priority is deterministic and independent from Action Log order", () => {
  const actions = [
    action({ id: "attack", actorUid: "attacker", targetUids: ["target"], effectType: "attack", priority: 50 }),
    action({ id: "protect", actorUid: "protector", targetUids: ["target"], effectType: "protect", priority: 30 }),
  ];
  const first = resolveNight(game, actions);
  const second = resolveNight(game, [...actions].reverse());
  assert.deepEqual(first, second);
  assert.deepEqual(first.deaths, []);
  assert.equal(first.survivors[0].reasonCode, "TARGET_SURVIVED_ATTACK");
  assert.deepEqual(first.survivors[0].sourceActionIds, ["protect"]);
});

test("a role marked as unable to die at night survives without protection", () => {
  const result = resolveNight(game, [
    action({ id: "kill", actorUid: "attacker", targetUids: ["immune"], effectType: "attack", priority: 50 }),
  ]);

  assert.deepEqual(result.deaths, []);
  assert.deepEqual(result.survivors, [{ targetUid: "immune", reasonCode: "TARGET_SURVIVED_ATTACK", sourceActionIds: [] }]);
  assert.equal(result.engineEvents[0].reasonCode, "TARGET_CANNOT_DIE_AT_NIGHT");
});

test("roleblock prevents an eligible later effect", () => {
  const result = resolveNight(game, [
    action({ id: "attack", actorUid: "attacker", targetUids: ["target"], effectType: "attack", priority: 50 }),
    action({ id: "block", actorUid: "blocker", targetUids: ["attacker"], effectType: "roleblock", priority: 10 }),
  ]);
  assert.deepEqual(result.deaths, []);
  assert.deepEqual(result.blockedActions, ["attack"]);
});

test("does not let a legacy arbitrary clean target replace automatic Janitor cleaning", () => {
  const result = resolveNight(game, [
    action({ id: "first-kill", actorUid: "attacker", targetUids: ["target"], effectType: "attack", priority: 50 }),
    action({ id: "second-kill", actorUid: "blocker", targetUids: ["target"], effectType: "attack", priority: 50 }),
    action({ id: "investigate", actorUid: "protector", targetUids: ["target"], effectType: "investigate", priority: 40, investigationType: "sheriff" }),
    action({ id: "clean", actorUid: "attacker", targetUids: ["target"], effectType: "clean", priority: 60 }),
  ]);
  assert.deepEqual(result.deaths, ["target"]);
  assert.deepEqual(result.cleanedPlayerUids, []);
  assert.equal(result.investigationResults[0].result, "INOCENTE");
});

test("resolves configured persistent status effects", () => {
  const result = resolveNight(game, [
    action({
      id: "curse",
      actorUid: "attacker",
      targetUids: ["target"],
      effectType: "status-effect",
      priority: 55,
      statusType: "cursed",
    }),
  ]);

  assert.deepEqual(result.appliedStatuses, [
    { targetUid: "target", statusType: "cursed", sourceActionId: "curse" },
  ]);
  assert.equal(result.partial, false);
});

test("lets action metadata block protection for a target status", () => {
  const state: EngineGameState = {
    ...game,
    players: game.players.map((player) =>
      player.uid === "target"
        ? { ...player, roleId: "mayor", statuses: ["mayor-revealed"] }
        : player,
    ),
  };
  const result = resolveNight(state, [
    action({
      id: "heal",
      actorUid: "protector",
      targetUids: ["target"],
      effectType: "protect",
      priority: 30,
      blockedByTargetStatuses: ["mayor-revealed"],
    }),
  ]);

  assert.deepEqual(result.failedActions, ["heal"]);
  assert.equal(result.engineEvents[0].reasonCode, "TARGET_STATUS_BLOCKS_PROTECTION");
});
