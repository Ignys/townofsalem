import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after, before } from "node:test";

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { get, ref, set, update } from "firebase/database";

let environment: RulesTestEnvironment;
const projectId = "demo-townofsalem";
const resetGameFixture = {
  hostUid: "host",
  public: {
    code: "RESET1",
    status: "in-progress",
    phase: "night",
    day: 2,
    currentNightId: "night-current",
  },
  settings: {
    roleComposition: { doctor: 1, mafioso: 1 },
    rolesAssignedAt: 1,
  },
  players: {
    player: {
      name: "Player",
      alive: false,
      disconnected: false,
      experience: "beginner",
      seat: 1,
    },
    other: {
      name: "Other",
      alive: true,
      disconnected: true,
      experience: "experienced",
      seat: 2,
    },
  },
  privatePlayers: {
    player: { roleId: "doctor", faction: "town" },
    other: { roleId: "mafioso", faction: "mafia" },
  },
  votes: { 2: { accusations: { player: "other" } } },
};

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
    await set(ref(context.database(), "games/startGame"), {
      hostUid: "host",
      public: { code: "START1", status: "lobby", phase: "lobby", day: 0 },
      settings: { maxPlayers: 15, roleComposition: { doctor: 1 } },
      players: {
        player: { name: "Player", alive: true, disconnected: false, experience: "beginner", seat: 1 },
      },
    });
    await set(ref(context.database(), "games/resetGame"), resetGameFixture);
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

test("host can atomically start the game in an untimed Night 1", async () => {
  const host = environment.authenticatedContext("host").database();

  await assertSucceeds(update(ref(host), {
    "games/startGame/public/status": "in-progress",
    "games/startGame/public/phase": "night",
    "games/startGame/public/phaseLabel": "Noite",
    "games/startGame/public/phaseSessionId": "phase-night-1",
    "games/startGame/public/currentNightId": "night-1-id",
    "games/startGame/public/phaseSequenceNumber": 1,
    "games/startGame/public/nightNumber": 1,
    "games/startGame/public/phaseEndsAt": null,
    "games/startGame/public/timerPaused": false,
    "games/startGame/public/timerRemainingMs": null,
    "games/startGame/settings/rolesAssignedAt": 1234,
    "games/startGame/privatePlayers/player": { roleId: "doctor", faction: "town" },
    "games/startGame/phaseSessions/phase-night-1": {
      id: "phase-night-1",
      phaseId: "night",
      label: "Noite",
      startedAt: 1234,
      sequenceNumber: 1,
      nightId: "night-1-id",
    },
    "games/startGame/nightSessions/night-1-id": {
      id: "night-1-id",
      phaseSessionId: "phase-night-1",
      nightNumber: 1,
      startedAt: 1234,
    },
  }));
});

test("host can end a game without declaring winners", async () => {
  const host = environment.authenticatedContext("host").database();

  await assertSucceeds(update(ref(host), {
    "games/game/public/status": "finished",
    "games/game/public/phase": "game-over",
    "games/game/public/phaseLabel": "Fim de jogo",
    "games/game/public/phaseEndsAt": null,
    "games/game/public/timerPaused": false,
    "games/game/public/timerRemainingMs": 0,
    "games/game/public/winningFactions": [],
    "games/game/public/winningPlayerUids": [],
    "games/game/public/gameEndedAt": 1,
    "games/game/events/game-ended": {
      type: "GAME_ENDED",
      timestamp: 1,
      actorUid: "host",
      visibility: "public",
      payload: {
        endedByHost: true,
        winningFactions: [],
        winningPlayerUids: [],
      },
    },
  }));
});

test("host can return an active game to the lobby without removing players", async () => {
  const host = environment.authenticatedContext("host").database();

  await assertSucceeds(update(ref(host), {
    "games/resetGame/public/status": "lobby",
    "games/resetGame/public/phase": "lobby",
    "games/resetGame/public/day": 0,
    "games/resetGame/public/currentNightId": null,
    "games/resetGame/settings/rolesAssignedAt": null,
    "games/resetGame/privatePlayers": null,
    "games/resetGame/votes": null,
    "games/resetGame/players/player/alive": true,
    "games/resetGame/players/other/alive": true,
    "games/resetGame/events/game-ended": {
      type: "GAME_ENDED",
      timestamp: 2,
      actorUid: "host",
      visibility: "public",
      payload: { endedByHost: true, returnedToLobby: true },
    },
  }));

  const [publicGame, settings, privatePlayers, players] = await Promise.all([
    assertSucceeds(get(ref(host, "games/resetGame/public"))),
    assertSucceeds(get(ref(host, "games/resetGame/settings"))),
    assertSucceeds(get(ref(host, "games/resetGame/privatePlayers"))),
    assertSucceeds(get(ref(host, "games/resetGame/players"))),
  ]);
  assert.equal(publicGame.child("status").val(), "lobby");
  assert.equal(publicGame.child("phase").val(), "lobby");
  assert.equal(settings.child("rolesAssignedAt").exists(), false);
  assert.equal(privatePlayers.exists(), false);
  assert.equal(players.child("player/alive").val(), true);
  assert.equal(players.child("other/alive").val(), true);
  assert.equal(players.size, 2);
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

test("only the host can add a simulated player with a bot key", async () => {
  const host = environment.authenticatedContext("host").database();
  const player = environment.authenticatedContext("intruder").database();
  const bot = {
    name: "Bot 1",
    isBot: true,
    alive: true,
    disconnected: false,
    experience: "experienced",
    seat: 1,
  };

  await assertSucceeds(
    set(ref(host, "games/lobbyGame/players/bot-test"), bot),
  );
  await assertSucceeds(
    update(ref(host, "games/lobbyGame/players/bot-test"), {
      name: "Jogador reserva",
    }),
  );
  await assertFails(
    set(ref(player, "games/lobbyGame/players/intruder"), bot),
  );
  await assertFails(
    update(ref(player, "games/lobbyGame/players/bot-test"), {
      name: "Nome adulterado",
    }),
  );
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
