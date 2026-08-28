import assert from "node:assert/strict";
import test from "node:test";

import type { PublicPlayerRecord } from "@/lib/firebase/schema";

import { getHostPlayerSidebarItems } from "./host-player-sidebar-items";

function player(name: string, alive: boolean): PublicPlayerRecord {
  return {
    name,
    alive,
    disconnected: false,
    experience: "experienced",
  };
}

const players = new Map<string, PublicPlayerRecord>([
  ["first", player("Alice", true)],
  ["second", player("Bruno", false)],
  ["third", player("Carla", true)],
  ["fourth", player("Diego", false)],
]);

test("preserves house order before the game starts", () => {
  const items = getHostPlayerSidebarItems(
    ["first", "second", "third", "fourth"],
    players,
    false,
  );

  assert.deepEqual(
    items.map((item) =>
      item.kind === "player"
        ? [item.playerUid, item.houseNumber]
        : item.kind,
    ),
    [
      ["first", 1],
      ["second", 2],
      ["third", 3],
      ["fourth", 4],
    ],
  );
});

test("shows living and dead player counts after the game starts", () => {
  const items = getHostPlayerSidebarItems(
    ["first", "second", "third", "fourth"],
    players,
    true,
  );

  assert.deepEqual(
    items.map((item) =>
      item.kind === "player"
        ? [item.playerUid, item.houseNumber]
        : item.kind === "living-separator"
          ? [item.kind, item.livingPlayerCount]
          : [item.kind, item.deadPlayerCount],
    ),
    [
      ["living-separator", 2],
      ["first", 1],
      ["third", 3],
      ["dead-separator", 2],
      ["second", 2],
      ["fourth", 4],
    ],
  );
});
