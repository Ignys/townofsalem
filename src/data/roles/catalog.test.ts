import assert from "node:assert/strict";
import test from "node:test";

import {
  getRoleById,
  getRolesByFaction,
  isValidRoleId,
  ROLE_DEFINITIONS,
} from "./index";

test("catalog contains every physical-card role with unique ids", () => {
  assert.equal(ROLE_DEFINITIONS.length, 29);
  assert.equal(
    new Set(ROLE_DEFINITIONS.map((role) => role.id)).size,
    ROLE_DEFINITIONS.length,
  );
});

test("catalog represents all 39 physical cards and their Virtue Values", () => {
  assert.equal(
    ROLE_DEFINITIONS.reduce((total, role) => total + role.cardCount, 0),
    43,
  );
  assert.equal(getRoleById("mayor")?.virtueValue, 8);
  assert.equal(getRoleById("consigliere")?.virtueValue, -10);
  assert.equal(getRoleById("amnesiac")?.virtueValue, 0);
});

test("getRoleById returns a known role", () => {
  const doctor = getRoleById("doctor");

  assert.equal(doctor?.name, "Doctor");
  assert.equal(doctor?.faction, "town");
  assert.equal(doctor?.canDieAtNight, true);
  assert.equal(
    doctor?.actionDefinitions?.[0].engineEffectType,
    "protect",
  );
});

test("getRolesByFaction returns only roles from that faction", () => {
  const mafiaRoles = getRolesByFaction("mafia");

  assert.equal(mafiaRoles.length, 7);
  assert.ok(mafiaRoles.every((role) => role.faction === "mafia"));
});

test("isValidRoleId narrows known ids and rejects unknown ids", () => {
  assert.equal(isValidRoleId("serial-killer"), true);
  assert.equal(isValidRoleId("invented-role"), false);
});

test("confirmed investigation exceptions and night immunity are explicit", () => {
  assert.equal(getRoleById("godfather")?.investigativeAppearance?.sheriff, "Good");
  assert.equal(getRoleById("politician")?.investigativeAppearance?.sheriff, "Evil");
  assert.equal(getRoleById("serial-killer")?.canDieAtNight, false);
  assert.equal(getRoleById("survivor")?.canDieAtNight, false);
});
