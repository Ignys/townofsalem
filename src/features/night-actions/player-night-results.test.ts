import assert from "node:assert/strict";
import test from "node:test";

import type { EngineEffect, NightResolution } from "@/game-engine/types";

import type { NightResolutionMessageLine } from "./night-resolution-message-types";
import {
  buildPlayerDawnNightResults,
  buildPlayerInstantNightResults,
} from "./player-night-results";

const base: NightResolution = {
  nightId: "night",
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

const names = { ana: "Ana", bia: "Bia", caio: "Caio", dex: "Dex", eva: "Eva" };

function lineText(line: NightResolutionMessageLine): string {
  return line.parts.map((part) =>
    part.kind === "role" ? ` [${part.roleId}]` : part.kind === "faction" ? ` [${part.faction}]` : part.text
  ).join("");
}

function effect(overrides: Partial<EngineEffect> & Pick<EngineEffect, "id" | "actorUid">): EngineEffect {
  return {
    roleId: "doctor",
    actionId: "protect",
    targetUids: [],
    effectType: "protect",
    priority: 0,
    ...overrides,
  } as EngineEffect;
}

test("instant results cover only the actor's investigations and medium clues", () => {
  const resolution: NightResolution = {
    ...base,
    investigationResults: [
      { actorUid: "ana", targetUid: "dex", investigationType: "exact-role", result: "bodyguard", sourceActionId: "a1" },
      { actorUid: "bia", targetUid: "dex", investigationType: "sheriff", result: "Evil", sourceActionId: "b1" },
    ],
    mediumClues: [{
      mediumUid: "ana",
      victimUid: "eva",
      responsiblePlayerUid: "caio",
      candidateUids: ["bia", "caio"],
      candidateCount: 2,
    }],
  };

  const results = buildPlayerInstantNightResults(resolution, "ana", names);
  assert.deepEqual(results.map(({ key }) => key), ["investigation-a1", "medium-eva"]);
  assert.deepEqual(results.map(({ line }) => lineText(line)), [
    "Você investigou Dex:  [bodyguard]",
    "Você consultou Eva: os suspeitos são Bia, Caio. Um deles foi responsável pela morte.",
  ]);
  // O jogador nunca vê qual dos suspeitos é o verdadeiro.
  assert.ok(results[1].line.parts.every((part) => !("tone" in part)));

  assert.deepEqual(
    buildPlayerInstantNightResults(resolution, "bia", names).map(({ line }) => lineText(line)),
    ["Você investigou Dex: suspeito."],
  );
  assert.deepEqual(buildPlayerInstantNightResults(resolution, "caio", names), []);
});

test("dawn results tell each player what happened to them", () => {
  const resolution: NightResolution = {
    ...base,
    deaths: ["eva", "dex"],
    deathRecords: [
      { targetUid: "eva", cause: "mafia-attack", attackerUid: "caio" },
      { targetUid: "dex", cause: "bodyguard-sacrifice", originalTargetUid: "ana", sourceActionId: "guard" },
    ],
    survivors: [{ targetUid: "bia", reasonCode: "HEALED", sourceActionIds: ["heal"] }],
    appliedEffects: [effect({ id: "heal", actorUid: "ana", targetUids: ["bia"], protectionType: "doctor" })],
    engineEvents: [
      { type: "PLAYER_ROLEBLOCKED", actorUid: "caio", targetUid: "ana", reasonCode: "ROLEBLOCK_APPLIED" },
    ],
    roleChanges: [{ playerUid: "caio", fromRoleId: "amnesiac", toRoleId: "sheriff", reasonCode: "AMNESIAC_REMEMBERED" }],
  };

  const results = buildPlayerDawnNightResults(resolution, names);
  assert.deepEqual(Object.fromEntries(
    Object.entries(results).map(([uid, lines]) => [uid, lines.map(lineText)]),
  ), {
    eva: ["Você morreu nesta noite."],
    dex: ["Você morreu nesta noite protegendo Ana."],
    bia: ["Você foi atacado nesta noite, mas um Doctor te curou!"],
    ana: [
      "Seu alvo Bia foi atacado e você o salvou.",
      "Você foi bloqueado nesta noite e sua ação não teve efeito.",
    ],
    caio: ["Você lembrou que era [sheriff]"],
  });
});

test("a bodyguard healed by the doctor learns they intercepted the attack", () => {
  const resolution: NightResolution = {
    ...base,
    survivors: [{ targetUid: "dex", reasonCode: "HEALED", sourceActionIds: ["heal"] }],
    appliedEffects: [
      effect({ id: "heal", actorUid: "ana", targetUids: ["dex"], protectionType: "doctor" }),
      effect({ id: "guard", actorUid: "dex", roleId: "bodyguard", targetUids: ["bia"], protectionType: "bodyguard" }),
    ],
    engineEvents: [{
      type: "DOCTOR_PREVENTED_DEATH",
      targetUid: "dex",
      actionId: "guard",
      reasonCode: "BODYGUARD_SACRIFICE_HEALED_BY_VARIANT",
    }],
  };

  const results = buildPlayerDawnNightResults(resolution, names);
  assert.deepEqual(results.dex.map(lineText), [
    "Você foi atacado nesta noite, mas um Doctor te curou!",
    "Você interceptou um ataque contra Bia.",
  ]);
  assert.deepEqual(results.ana.map(lineText), ["Seu alvo Dex foi atacado e você o salvou."]);
});

test("a quiet night gives nobody a dawn result", () => {
  assert.deepEqual(buildPlayerDawnNightResults(base, names), {});
});

test("a survivor learns whether a Doctor healed them or someone guarded them", () => {
  const healed = buildPlayerDawnNightResults({
    ...base,
    survivors: [{ targetUid: "bia", reasonCode: "HEALED", sourceActionIds: ["heal"] }],
    appliedEffects: [effect({ id: "heal", actorUid: "ana", targetUids: ["bia"], protectionType: "doctor" })],
  }, names);
  assert.deepEqual(healed.bia.map(lineText), ["Você foi atacado nesta noite, mas um Doctor te curou!"]);

  const guarded = buildPlayerDawnNightResults({
    ...base,
    survivors: [{ targetUid: "bia", reasonCode: "GUARDED", sourceActionIds: ["guard"] }],
    appliedEffects: [effect({ id: "guard", actorUid: "dex", roleId: "bodyguard", targetUids: ["bia"], protectionType: "bodyguard" })],
  }, names);
  assert.deepEqual(guarded.bia.map(lineText), ["Você foi atacado nesta noite, mas alguém te protegeu!"]);

  const immune = buildPlayerDawnNightResults({
    ...base,
    survivors: [{ targetUid: "bia", reasonCode: "IMMUNE", sourceActionIds: [] }],
  }, names);
  assert.deepEqual(immune.bia.map(lineText), ["Você foi atacado nesta noite, mas sobreviveu."]);
});
