import assert from "node:assert/strict";
import test from "node:test";

import type { HostNightActionEntry, Player, RoleDefinition } from "@/types";

import { formatHostActionEntry, isBasicHostActionEntry } from "./host-action-entry";
import { hasBlockingHostActionIssues, validateHostNightAction } from "./validate-host-night-action";

const players: Player[] = [
  { id: "actor", uid: "actor", name: "Fulano", alive: true, disconnected: false, experience: "experienced" },
  { id: "target", uid: "target", name: "João", alive: true, disconnected: false, experience: "experienced" },
];
const role: RoleDefinition = {
  id: "sheriff",
  name: "Sheriff",
  faction: "town",
  alignment: "Town Investigative",
  description: "fixture",
  goal: "fixture",
  virtueValue: 7,
  cardCount: 1,
  importantInteractions: [],
  attack: "none",
  defense: "none",
  verificationStatus: "verified",
  actionDefinitions: [{
    id: "investigate", label: "Investigar", verb: "investiga", type: "investigate",
    requiresTarget: true, targetCount: 1, allowedTargetType: "player", allowSelfTarget: false,
    allowDeadTarget: false, engineEffectType: "investigate", verificationStatus: "verified",
  }],
};
const entry: HostNightActionEntry = {
  id: "entry", nightId: "night", actorUid: "actor", roleIdSnapshot: "sheriff",
  actionId: "investigate", targetUids: ["target"], createdAt: 1, updatedAt: 1, status: "confirmed",
};
const context = { players, assignments: { actor: "sheriff", target: "doctor" }, roleDefinitions: [role], nightId: "night" };

test("keeps the structured entry authoritative and derives its human phrase", () => {
  assert.equal(isBasicHostActionEntry(entry), true);
  assert.equal(formatHostActionEntry(entry, context), "Fulano — Sheriff — investiga — João");
});

test("validates a confirmed action against actor, role, targets and night", () => {
  assert.deepEqual(validateHostNightAction(entry, context), []);
});

test("blocks wrong night, self-target and invalid target count", () => {
  const issues = validateHostNightAction({ ...entry, nightId: "other", targetUids: ["actor", "target"] }, context);
  assert.equal(hasBlockingHostActionIssues(issues), true);
  assert.deepEqual(issues.map(({ code }) => code), ["WRONG_NIGHT", "TARGET_COUNT", "SELF_TARGET_FORBIDDEN"]);
});
