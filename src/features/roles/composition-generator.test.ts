import assert from "node:assert/strict";
import test from "node:test";

import { ROLE_DEFINITIONS } from "@/data/roles";

import { generateRoleComposition } from "./composition-generator";

test("generates deterministically from confirmed faction taxonomy and injected RNG", () => {
  const slots = [{ id: "town", label: "Town", count: 2, factions: ["town" as const] }, { id: "mafia", label: "Mafia", count: 1, factions: ["mafia" as const] }];
  const first = generateRoleComposition(3, slots, ROLE_DEFINITIONS, () => 0);
  const second = generateRoleComposition(3, slots, ROLE_DEFINITIONS, () => 0);
  assert.deepEqual(first, second);
  assert.deepEqual(first, { ok: true, roleIds: ["bodyguard", "deputy", "blackmailer"] });
});

test("returns structured errors without mutating inputs", () => {
  const slots = Object.freeze([{ id: "impossible", label: "Impossible", count: 2, roleIds: Object.freeze(["doctor"]) }]);
  assert.deepEqual(generateRoleComposition(2, slots, ROLE_DEFINITIONS, () => 0), { ok: false, code: "NO_ELIGIBLE_ROLE", slotId: "impossible" });
  assert.equal(slots[0].roleIds?.[0], "doctor");
});
