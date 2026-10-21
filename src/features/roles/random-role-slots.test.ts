import assert from "node:assert/strict";
import { test } from "node:test";

import { getRoleById } from "@/data/roles";

import {
  estimateVirtue,
  parseRandomRoleExclusions,
  RandomRoleResolutionError,
  resolveRandomRoles,
} from "./random-role-slots";

test("fills each slot with a role of its faction and keeps fixed roles", () => {
  const resolved = resolveRandomRoles(
    ["sheriff", "random-town", "random-mafia", "random-neutral"],
    { excludedRoleIds: [], respectCardCount: true },
  );

  assert.equal(resolved[0], "sheriff");
  assert.deepEqual(
    resolved.slice(1).map((roleId) => getRoleById(roleId)?.faction),
    ["town", "mafia", "neutral"],
  );
});

test("never rolls an excluded role", () => {
  for (let run = 0; run < 200; run += 1) {
    const [rolled] = resolveRandomRoles(["random-mafia"], {
      excludedRoleIds: ["godfather", "mafioso", "janitor", "consigliere", "disguiser", "framer"],
      respectCardCount: true,
    });
    assert.equal(rolled, "blackmailer");
  }
});

test("the card cap counts fixed copies; without it roles may repeat", () => {
  const onlyBlackmailer = ["godfather", "mafioso", "janitor", "consigliere", "disguiser", "framer"];

  assert.throws(
    () => resolveRandomRoles(["blackmailer", "random-mafia"], { excludedRoleIds: onlyBlackmailer, respectCardCount: true }),
    RandomRoleResolutionError,
  );
  assert.deepEqual(
    resolveRandomRoles(["blackmailer", "random-mafia"], { excludedRoleIds: onlyBlackmailer, respectCardCount: false }),
    ["blackmailer", "blackmailer"],
  );
});

test("an all-random table rerolls until it has a Mafia", () => {
  for (let run = 0; run < 50; run += 1) {
    const resolved = resolveRandomRoles(
      Array<string>(7).fill("random-any"),
      { excludedRoleIds: [], respectCardCount: true },
    );
    assert.ok(resolved.some((roleId) => getRoleById(roleId)?.faction === "mafia"));
  }
});

test("an empty stored exclusion list stays empty; absent means defaults", () => {
  assert.deepEqual(parseRandomRoleExclusions(""), []);
  assert.deepEqual(parseRandomRoleExclusions("godfather,witch"), ["godfather", "witch"]);
  assert.deepEqual(parseRandomRoleExclusions(undefined), ["godfather", "mayor"]);
});

test("the virtue estimate adds each slot's pool average, min and max", () => {
  const mafia = ["blackmailer", "consigliere", "disguiser", "framer", "godfather", "janitor", "mafioso"]
    .map((roleId) => getRoleById(roleId)!.virtueValue);
  const sheriff = getRoleById("sheriff")!.virtueValue;

  assert.deepEqual(
    estimateVirtue(["sheriff", "random-mafia"], { excludedRoleIds: [], respectCardCount: true }),
    {
      expected: sheriff + mafia.reduce((a, b) => a + b, 0) / mafia.length,
      min: sheriff + Math.min(...mafia),
      max: sheriff + Math.max(...mafia),
    },
  );
});
