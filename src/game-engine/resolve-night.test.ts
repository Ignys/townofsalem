import assert from "node:assert/strict";
import test from "node:test";

import { resolveAttackAgainstDefense } from "./attack-defense";
import { resolveNight } from "./resolve-night";
import type { AttackDefenseRule, EngineGameState, EngineNightAction, EngineRulesContext } from "./types";

const rules: AttackDefenseRule[] = [
  { attackLevel: "basic", defenseLevel: "none", success: true },
  { attackLevel: "basic", defenseLevel: "basic", success: false },
  { attackLevel: "powerful", defenseLevel: "basic", success: true },
  { attackLevel: "powerful", defenseLevel: "powerful", success: false },
];
const context: EngineRulesContext = { roleDefinitions: [], attackDefenseRules: rules };
const game: EngineGameState = {
  gameId: "game", nightId: "night", players: [
    { uid: "attacker", name: "Atacante", alive: true, roleId: "a", faction: "mafia", defense: "none", statuses: [] },
    { uid: "protector", name: "Protetor", alive: true, roleId: "p", faction: "town", defense: "none", statuses: [] },
    { uid: "target", name: "Alvo", alive: true, roleId: "t", faction: "town", defense: "none", statuses: [], investigativeAppearance: { sheriff: "INOCENTE" } },
    { uid: "blocker", name: "Bloqueador", alive: true, roleId: "b", faction: "town", defense: "none", statuses: [] },
  ],
};

function action(overrides: Partial<EngineNightAction> & Pick<EngineNightAction, "id" | "actorUid" | "targetUids">): EngineNightAction {
  return { roleId: "fixture", actionId: overrides.id, ...overrides };
}

test("attack and defense are exclusively driven by the configured table", () => {
  assert.equal(resolveAttackAgainstDefense("basic", "none", rules).success, true);
  assert.equal(resolveAttackAgainstDefense("basic", "basic", rules).success, false);
  assert.equal(resolveAttackAgainstDefense("unstoppable", "none", rules).success, null);
});

test("priority is deterministic and independent from Action Log order", () => {
  const actions = [
    action({ id: "attack", actorUid: "attacker", targetUids: ["target"], effectType: "attack", priority: 50, attackLevel: "basic" }),
    action({ id: "protect", actorUid: "protector", targetUids: ["target"], effectType: "protect", priority: 30, protectionLevel: "basic" }),
  ];
  const first = resolveNight(game, actions, context);
  const second = resolveNight(game, [...actions].reverse(), context);
  assert.deepEqual(first, second);
  assert.deepEqual(first.deaths, []);
  assert.equal(first.survivors[0].reasonCode, "TARGET_SURVIVED_ATTACK");
});

test("roleblock prevents an eligible later effect", () => {
  const result = resolveNight(game, [
    action({ id: "attack", actorUid: "attacker", targetUids: ["target"], effectType: "attack", priority: 50, attackLevel: "basic" }),
    action({ id: "block", actorUid: "blocker", targetUids: ["attacker"], effectType: "roleblock", priority: 10 }),
  ], context);
  assert.deepEqual(result.deaths, []);
  assert.deepEqual(result.blockedActions, ["attack"]);
});

test("supports multiple attacks, investigations and conditional post-death clean", () => {
  const result = resolveNight(game, [
    action({ id: "weak", actorUid: "attacker", targetUids: ["target"], effectType: "attack", priority: 50, attackLevel: "basic" }),
    action({ id: "strong", actorUid: "blocker", targetUids: ["target"], effectType: "attack", priority: 50, attackLevel: "powerful" }),
    action({ id: "investigate", actorUid: "protector", targetUids: ["target"], effectType: "investigate", priority: 40, investigationType: "sheriff" }),
    action({ id: "clean", actorUid: "attacker", targetUids: ["target"], effectType: "clean", priority: 60 }),
  ], context);
  assert.deepEqual(result.deaths, ["target"]);
  assert.deepEqual(result.cleanedPlayerUids, ["target"]);
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
  ], context);

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
      protectionLevel: "basic",
      blockedByTargetStatuses: ["mayor-revealed"],
    }),
  ], context);

  assert.deepEqual(result.failedActions, ["heal"]);
  assert.equal(result.engineEvents[0].reasonCode, "TARGET_STATUS_BLOCKS_PROTECTION");
});
