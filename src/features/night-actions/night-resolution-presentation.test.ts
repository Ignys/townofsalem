import assert from "node:assert/strict";
import test from "node:test";

import type { NightResolution } from "@/game-engine/types";

import { presentNightResolution } from "./night-resolution-presentation";

const base: NightResolution = {
  nightId: "night", deaths: [], survivors: [], investigationResults: [], appliedEffects: [],
  blockedActions: [], failedActions: [], warnings: [], engineEvents: [], cleanedPlayerUids: [], partial: false,
};

test("derives no-death and causal copy from structured resolution", () => {
  assert.deepEqual(presentNightResolution(base, {}).summary, ["Ninguém morreu nesta noite."]);
  const presentation = presentNightResolution({
    ...base,
    deaths: ["joao"],
    investigationResults: [{ actorUid: "ana", targetUid: "joao", investigationType: "sheriff", result: "SUSPEITO", sourceActionId: "a" }],
    engineEvents: [{ type: "PLAYER_DIED", targetUid: "joao", reasonCode: "NIGHT_KILL_RESOLVED" }],
  }, { ana: "Ana", joao: "João" });
  assert.deepEqual(presentation.summary, ["João morreu.", "Ana investigou João: informe SUSPEITO."]);
  assert.match(presentation.details[0], /NIGHT_KILL_RESOLVED/);
});
