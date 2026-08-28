import assert from "node:assert/strict";
import test from "node:test";

import type { NightResolution } from "@/game-engine/types";

import type { NightResolutionMessageLine } from "./night-resolution-message-types";
import { presentNightResolution } from "./night-resolution-presentation";

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

function lineText(line: NightResolutionMessageLine): string {
  return line.parts.map((part) =>
    part.kind === "role" ? ` [${part.roleId}]` : part.text
  ).join("");
}

function playerUids(line: NightResolutionMessageLine): string[] {
  return line.parts.flatMap((part) =>
    part.kind === "player" ? [part.playerUid] : []
  );
}

test("keeps public announcements free of killer identities and private results", () => {
  assert.deepEqual(
    presentNightResolution(base, {}).announcements.map(lineText),
    ["Ninguém morreu nesta noite."],
  );

  const presentation = presentNightResolution({
    ...base,
    deaths: ["joao"],
    deathRecords: [{
      targetUid: "joao",
      attackerUid: "mafioso",
      cause: "mafia-attack",
    }],
    survivors: [{ targetUid: "bia", reasonCode: "TARGET_SURVIVED_ATTACK", sourceActionIds: [] }],
    investigationResults: [{
      actorUid: "ana",
      targetUid: "joao",
      investigationType: "sheriff",
      result: "SUSPEITO",
      sourceActionId: "investigate",
    }],
    appliedStatuses: [{ targetUid: "joao", statusType: "cursed", sourceActionId: "curse" }],
  }, {
    ana: "Ana",
    bia: "Bia",
    joao: "João",
    mafioso: "Carlos",
  }, {
    joao: "doctor",
    mafioso: "godfather",
  });

  assert.deepEqual(
    presentation.announcements.map(lineText),
    ["João [doctor] morreu para um ataque da Máfia."],
  );
  assert.deepEqual(playerUids(presentation.announcements[0]), ["joao"]);
  assert.ok(!lineText(presentation.announcements[0]).includes("Carlos"));
  assert.ok(!lineText(presentation.announcements[0]).includes("SUSPEITO"));
  assert.ok(presentation.hostPrivateInformation.some((line) =>
    lineText(line).includes("Responsável: Carlos")
  ));
});

test("hides the role, but keeps the public cause, when the body was cleaned", () => {
  const presentation = presentNightResolution({
    ...base,
    deaths: ["joao"],
    cleanedPlayerUids: ["joao"],
    deathRecords: [{
      targetUid: "joao",
      attackerUid: "mafioso",
      cause: "mafia-attack",
    }],
  }, {
    joao: "João",
    mafioso: "Carlos",
  }, {
    joao: "doctor",
    mafioso: "godfather",
  });

  assert.equal(
    lineText(presentation.announcements[0]),
    "João morreu para um ataque da Máfia.",
  );
  assert.ok(!lineText(presentation.announcements[0]).includes("doctor"));
  assert.ok(!lineText(presentation.announcements[0]).includes("Carlos"));

  const privateDeath = lineText(presentation.hostPrivateInformation[0]);
  assert.match(privateDeath, /João \[doctor\]/);
  assert.match(privateDeath, /Responsável: Carlos/);
  assert.match(privateDeath, /corpo foi limpo pelo Janitor/);
});

test("keeps Bodyguard participants private while announcing only the cause", () => {
  const presentation = presentNightResolution({
    ...base,
    deaths: ["guard"],
    deathRecords: [{
      targetUid: "guard",
      attackerUid: "mafioso",
      cause: "bodyguard-sacrifice",
      originalTargetUid: "target",
      originalAttackCause: "mafia-attack",
    }],
  }, {
    guard: "Bruno",
    mafioso: "Carlos",
    target: "Pinky",
  }, {
    guard: "bodyguard",
  });

  assert.equal(
    lineText(presentation.announcements[0]),
    "Bruno [bodyguard] morreu para um sacrifício durante a proteção de outra pessoa.",
  );
  assert.ok(!lineText(presentation.announcements[0]).includes("Carlos"));
  assert.ok(!lineText(presentation.announcements[0]).includes("Pinky"));

  const privateDeath = lineText(presentation.hostPrivateInformation[0]);
  assert.match(privateDeath, /Responsável: Carlos/);
  assert.match(privateDeath, /Alvo original do confronto: Pinky/);
});

test("groups investigation, survival, role change and win messages by recipient", () => {
  const presentation = presentNightResolution({
    ...base,
    survivors: [{ targetUid: "ana", reasonCode: "TARGET_SURVIVED_ATTACK", sourceActionIds: [] }],
    investigationResults: [{
      actorUid: "ana",
      targetUid: "joao",
      investigationType: "exact-role",
      result: "Doctor",
      sourceActionId: "investigate",
    }],
    roleChanges: [{
      playerUid: "ana",
      fromRoleId: "executioner",
      toRoleId: "jester",
      reasonCode: "EXECUTIONER_TARGET_DIED_AT_NIGHT",
    }],
    individualWinnerUids: ["ana", "unknown"],
  }, { ana: "Ana", joao: "João" });

  assert.deepEqual(
    presentation.individualMessages[0].messages.map(lineText),
    [
      "Foi atacado nesta noite, mas sobreviveu.",
      "Investigou João: informe Doctor.",
      "Sua nova role é Jester.",
      "Cumpriu sua condição individual de vitória.",
    ],
  );
  assert.deepEqual(
    playerUids(presentation.individualMessages[0].messages[1]),
    ["joao"],
  );
  assert.equal(presentation.individualMessages[1].playerUid, "unknown");
});

test("marks every named Medium suspect as a clickable player part", () => {
  const presentation = presentNightResolution({
    ...base,
    mediumClues: [{
      mediumUid: "medium",
      victimUid: "victim",
      responsiblePlayerUid: "killer",
      candidateUids: ["killer", "other"],
      candidateCount: 2,
    }],
  }, {
    medium: "Maria",
    victim: "Vítima",
    killer: "Assassino",
    other: "Inocente",
  });

  const clue = presentation.individualMessages[0].messages[0];
  assert.equal(
    lineText(clue),
    "Consultou Vítima: os suspeitos são Assassino, Inocente. Um deles foi responsável pela morte.",
  );
  assert.deepEqual(playerUids(clue), ["victim", "killer", "other"]);
  const killerPart = clue.parts.find((part) =>
    part.kind === "player" && part.playerUid === "killer"
  );
  assert.ok(killerPart?.kind === "player");
  assert.equal(killerPart.tone, "danger");
});

test("turns engine codes into readable private details", () => {
  const presentation = presentNightResolution({
    ...base,
    appliedStatuses: [{ targetUid: "ana", statusType: "blackmailed", sourceActionId: "blackmail" }],
    removedStatuses: [{ targetUid: "ana", statusType: "town-blocked-next-night" }],
    consumedResources: [{ playerUid: "ana", resource: "janitor", amount: 1 }],
    randomDecisions: [{ key: "amnesiac-role:remember", candidateUids: ["doctor", "jester"], selectedUid: "doctor" }],
    warnings: [{ code: "CHECK", message: "Revisar ação" }],
    engineEvents: [{
      type: "PLAYER_ROLEBLOCKED",
      actorUid: "ana",
      targetUid: "joao",
      reasonCode: "ROLEBLOCK_APPLIED",
    }],
  }, { ana: "Ana", joao: "João" });

  assert.ok(presentation.hostPrivateInformation.some((line) =>
    lineText(line).includes("Ana ficou chantageado")
  ));
  assert.ok(presentation.hostPrivateInformation.some((line) =>
    lineText(line).includes("Sorteio do Amnesiac: Doctor")
  ));
  assert.deepEqual(presentation.warnings, ["Revisar ação"]);
  assert.equal(lineText(presentation.resolutionDetails[0]), "Ana bloqueou a ação de João.");
  assert.deepEqual(playerUids(presentation.resolutionDetails[0]), ["ana", "joao"]);
});

test("normalizes optional collections omitted by Firebase", () => {
  const sparse = {
    ...base,
    survivors: undefined,
    investigationResults: undefined,
    blockedActions: undefined,
    failedActions: undefined,
    engineEvents: undefined,
    cleanedPlayerUids: undefined,
  } as unknown as NightResolution;

  const presentation = presentNightResolution(sparse, {});
  assert.deepEqual(presentation.announcements.map(lineText), ["Ninguém morreu nesta noite."]);
  assert.deepEqual(presentation.individualMessages, []);
  assert.deepEqual(presentation.hostPrivateInformation, []);
  assert.deepEqual(presentation.resolutionDetails, []);
  assert.deepEqual(presentation.warnings, []);
});
