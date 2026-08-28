import assert from "node:assert/strict";
import test from "node:test";

import type {
  PrivatePlayerRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";

import { selectDeputyPromotion } from "./deputy-promotion";

function publicPlayer(alive: boolean): PublicPlayerRecord {
  return {
    name: "Jogador",
    alive,
    disconnected: false,
    experience: "beginner",
  };
}

function privatePlayer(
  roleId: string,
  originalRoleId = roleId,
): PrivatePlayerRecord {
  return { roleId, originalRoleId, faction: "town" };
}

test("promotes a living Deputy only after the original Sheriff dies", () => {
  const privatePlayers = {
    sheriff: privatePlayer("sheriff"),
    deputy: privatePlayer("deputy"),
  };

  assert.equal(selectDeputyPromotion({
    sheriff: publicPlayer(true),
    deputy: publicPlayer(true),
  }, privatePlayers, () => 0), null);

  assert.deepEqual(selectDeputyPromotion({
    sheriff: publicPlayer(false),
    deputy: publicPlayer(true),
  }, privatePlayers, () => 0), {
    playerUid: "deputy",
    candidateUids: ["deputy"],
  });
});

test("randomly selects one living Deputy from stable candidates", () => {
  const promotion = selectDeputyPromotion({
    sheriff: publicPlayer(false),
    deputyB: publicPlayer(true),
    deputyA: publicPlayer(true),
    deadDeputy: publicPlayer(false),
  }, {
    sheriff: privatePlayer("sheriff"),
    deputyB: privatePlayer("deputy"),
    deputyA: privatePlayer("deputy"),
    deadDeputy: privatePlayer("deputy"),
  }, () => 0.99);

  assert.deepEqual(promotion, {
    playerUid: "deputyB",
    candidateUids: ["deputyA", "deputyB"],
  });
});

test("does not promote another Deputy after the first promotion", () => {
  assert.equal(selectDeputyPromotion({
    sheriff: publicPlayer(false),
    promoted: publicPlayer(false),
    remaining: publicPlayer(true),
  }, {
    sheriff: privatePlayer("sheriff"),
    promoted: privatePlayer("sheriff", "deputy"),
    remaining: privatePlayer("deputy"),
  }, () => 0), null);
});

test("does not promote without an original Sheriff in the match", () => {
  assert.equal(selectDeputyPromotion({
    deputy: publicPlayer(true),
  }, {
    deputy: privatePlayer("deputy"),
  }), null);
});
