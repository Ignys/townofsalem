import assert from "node:assert/strict";
import test from "node:test";

import { getRoleById } from "@/data/roles";

import { orderSelectedRoles } from "./role-composition-order";

test("natural order groups selected roles as Town, Mafia, then Neutral", () => {
  const ordered = orderSelectedRoles(
    ["amnesiac", "consigliere", "mayor", "doctor", "godfather"],
    "natural",
  );

  assert.deepEqual(
    ordered.map(({ roleId }) => getRoleById(roleId)?.faction),
    ["town", "town", "mafia", "mafia", "neutral"],
  );
  assert.deepEqual(
    ordered.map(({ roleId }) => roleId),
    ["doctor", "mayor", "consigliere", "godfather", "amnesiac"],
  );
});

test("numeric order sorts by descending Virtue Value", () => {
  const ordered = orderSelectedRoles(
    ["consigliere", "amnesiac", "doctor", "mayor"],
    "virtue",
  );

  assert.deepEqual(
    ordered.map(({ roleId }) => getRoleById(roleId)?.virtueValue),
    [8, 4, 0, -10],
  );
});

test("ordered roles retain their original indexes for removal", () => {
  const ordered = orderSelectedRoles(
    ["consigliere", "mayor", "amnesiac"],
    "natural",
  );

  assert.deepEqual(
    ordered.map(({ originalIndex }) => originalIndex),
    [1, 0, 2],
  );
});
