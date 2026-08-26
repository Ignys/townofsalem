import assert from "node:assert/strict";
import test from "node:test";

import { firebasePaths } from "@/lib/firebase/paths";

import { createEndGameUpdates } from "./end-game-updates";

test("returns the game to the lobby and makes every participant alive", () => {
  const gameId = "game-1";
  const updates = createEndGameUpdates({
    gameId,
    hostUid: "host-1",
    playerUids: ["player-1", "player-2"],
    winners: {},
    endedAt: 1234,
    eventId: "event-1",
  });

  assert.equal(
    updates[firebasePaths.gamePublicField(gameId, "status")],
    "lobby",
  );
  assert.equal(
    updates[firebasePaths.gamePublicField(gameId, "phase")],
    "lobby",
  );
  assert.equal(
    updates[firebasePaths.gamePlayerField(gameId, "player-1", "alive")],
    true,
  );
  assert.equal(
    updates[firebasePaths.gamePlayerField(gameId, "player-2", "alive")],
    true,
  );
  assert.equal(updates[firebasePaths.gamePlayers(gameId)], undefined);
});

test("clears role assignments and transient round state for a new draw", () => {
  const gameId = "game-1";
  const updates = createEndGameUpdates({
    gameId,
    hostUid: "host-1",
    playerUids: [],
    winners: { factions: ["town"], playerUids: ["player-1"] },
    endedAt: 1234,
    eventId: "event-1",
  });

  assert.equal(
    updates[firebasePaths.gameSettingsField(gameId, "rolesAssignedAt")],
    null,
  );
  assert.equal(updates[firebasePaths.gamePrivatePlayers(gameId)], null);
  assert.equal(updates[firebasePaths.gameActions(gameId)], null);
  assert.equal(updates[firebasePaths.gameVotes(gameId)], null);
  assert.deepEqual(updates[firebasePaths.gameEvent(gameId, "event-1")], {
    type: "GAME_ENDED",
    timestamp: 1234,
    actorUid: "host-1",
    visibility: "public",
    payload: {
      endedByHost: true,
      returnedToLobby: true,
      winningFactions: ["town"],
      winningPlayerUids: ["player-1"],
    },
  });
});
