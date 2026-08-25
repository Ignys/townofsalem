import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after, before } from "node:test";

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { get, ref, set, update } from "firebase/database";

let environment: RulesTestEnvironment;
const projectId = "demo-townofsalem";

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: readFileSync("database.rules.json", "utf8"),
    },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), "games/game"), {
      hostUid: "host",
      public: { code: "ABCDEF", status: "in-progress", phase: "day", day: 1 },
      players: {
        player: { name: "Player", alive: true, disconnected: false, experience: "beginner", seat: 1 },
        other: { name: "Other", alive: true, disconnected: false, experience: "experienced", seat: 2 },
        newRole: { name: "New Role", alive: true, disconnected: false, experience: "experienced", seat: 3 },
      },
      privatePlayers: {
        player: { roleId: "doctor", faction: "town" },
        other: { roleId: "sheriff", faction: "town" },
      },
    });
    await set(ref(context.database(), "games/lobbyGame"), {
      hostUid: "host",
      public: { code: "QWERTY", status: "lobby", phase: "lobby", day: 0 },
      settings: { maxPlayers: 15 },
    });
  });
});

after(async () => environment?.cleanup());

test("unauthenticated and cross-player secret reads fail", async () => {
  await assertFails(get(ref(environment.unauthenticatedContext().database(), "games/game/public")));
  const player = environment.authenticatedContext("player").database();
  await assertSucceeds(get(ref(player, "games/game/privatePlayers/player")));
  await assertFails(get(ref(player, "games/game/privatePlayers/other")));
  await assertFails(get(ref(player, "games/game/privatePlayers")));
});

test("malicious player administrative writes fail", async () => {
  const player = environment.authenticatedContext("player").database();
  await assertFails(update(ref(player), { "games/game/public/phase": "night" }));
  await assertFails(update(ref(player), { "games/game/players/other/alive": false }));
  await assertFails(set(ref(player, "games/game/hostNightActions/night/action"), { id: "action" }));
  await assertFails(set(ref(player, "games/game/hostNotes/night/note"), { id: "note" }));
  await assertFails(set(ref(player, "games/game/nightResolutions/night"), { id: "resolution" }));
  await assertFails(set(ref(player, "games/game/events/event"), { type: "GAME_ENDED", timestamp: 1, payload: {} }));
});

test("host can operate protected branches while Event History stays append-only", async () => {
  const host = environment.authenticatedContext("host").database();
  await assertSucceeds(update(ref(host), { "games/game/public/phase": "night" }));
  await assertSucceeds(set(ref(host, "games/game/events/event"), { type: "PHASE_CHANGED", timestamp: 1, actorUid: "host", visibility: "host-only", payload: { to: "night" } }));
  await assertFails(update(ref(host, "games/game/events/event"), { timestamp: 2 }));
  const snapshot = await assertSucceeds(get(ref(host, "games/game/privatePlayers")));
  assert.equal(snapshot.child("player/roleId").val(), "doctor");
});

test("host can save every new role and valid physical copy counts", async () => {
  const host = environment.authenticatedContext("host").database();
  await assertSucceeds(update(ref(host), {
    "games/lobbyGame/settings/roleComposition": {
      townie: 8,
      politician: 2,
      werewolf: 1,
    },
  }));
  await assertSucceeds(set(ref(host, "games/game/privatePlayers/newRole"), {
    roleId: "werewolf",
    faction: "neutral",
  }));
});

test("role composition rejects unknown roles and counts above the deck limit", async () => {
  const host = environment.authenticatedContext("host").database();
  await assertFails(set(
    ref(host, "games/lobbyGame/settings/roleComposition/townie"),
    9,
  ));
  await assertFails(set(
    ref(host, "games/lobbyGame/settings/roleComposition/invented-role"),
    1,
  ));
});
