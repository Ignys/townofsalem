import assert from "node:assert/strict";
import test from "node:test";

import type { HostNightActionEntry, Player, RoleDefinition } from "@/types";
import { ROLE_DEFINITIONS } from "@/data/roles";

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
  canDieAtNight: true,
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

test("Bodyguard repeat-target variant checks only the immediately previous night", () => {
  const currentEntry: HostNightActionEntry = {
    ...entry,
    id: "current",
    nightId: "night-4",
    nightNumber: 4,
    roleIdSnapshot: "bodyguard",
    actionId: "guard",
  };
  const previousEntry: HostNightActionEntry = {
    ...currentEntry,
    id: "previous",
    nightId: "night-3",
    nightNumber: 3,
  };
  const bodyguardContext = {
    players,
    assignments: { actor: "bodyguard", target: "doctor" },
    roleDefinitions: ROLE_DEFINITIONS,
    nightId: "night-4",
    nightNumber: 4,
    variants: { bodyguardCannotGuardSameTargetTwice: true },
  };

  const consecutiveIssues = validateHostNightAction(currentEntry, {
    ...bodyguardContext,
    actionEntries: [previousEntry],
  });
  assert.ok(consecutiveIssues.some(({ code }) => code === "BODYGUARD_REPEATED_TARGET"));

  const nonConsecutiveIssues = validateHostNightAction(currentEntry, {
    ...bodyguardContext,
    actionEntries: [{ ...previousEntry, nightNumber: 2 }],
  });
  assert.ok(!nonConsecutiveIssues.some(({ code }) => code === "BODYGUARD_REPEATED_TARGET"));
});

test("the Guardian Angel's protection is capped at three uses per game", () => {
  const angelContext = {
    players: [
      { id: "angel", uid: "angel", name: "Anjo", alive: true, disconnected: false, experience: "experienced" as const },
      { id: "ward", uid: "ward", name: "Protegido", alive: true, disconnected: false, experience: "experienced" as const },
    ],
    assignments: { angel: "guardian-angel", ward: "townie" },
    roleDefinitions: ROLE_DEFINITIONS,
    nightId: "night-5",
    nightNumber: 5,
  };
  const guard = (id: string, nightId = "night-5"): HostNightActionEntry => ({
    id,
    nightId,
    actorUid: "angel",
    roleIdSnapshot: "guardian-angel",
    actionId: "guard-target",
    targetUids: ["ward"],
    createdAt: 1,
    updatedAt: 1,
    status: "confirmed",
  });
  const spent = ["n2", "n3", "n4"].map((id) => guard(id, "night-5"));

  assert.deepEqual(
    validateHostNightAction(guard("n4-again"), {
      ...angelContext,
      actionEntries: spent.slice(0, 2),
    }),
    [],
    "the third use is still allowed",
  );

  const blocked = validateHostNightAction(guard("n5"), {
    ...angelContext,
    actionEntries: spent,
  });
  assert.deepEqual(blocked.map(({ code }) => code), ["ACTION_USE_LIMIT_REACHED"]);
});
