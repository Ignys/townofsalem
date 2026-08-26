import assert from "node:assert/strict";
import test from "node:test";

import type { PublicPlayerRecord } from "@/lib/firebase/schema";

import { BOT_NAMES } from "./bot-names";
import {
  createBotPlayerUid,
  getRandomAvailableBotName,
} from "./bot-player";

function player(name: string, isBot = false): PublicPlayerRecord {
  return {
    name,
    isBot: isBot || undefined,
    alive: true,
    disconnected: false,
    experience: "experienced",
  };
}

test("randomly selects from bot names that are not already in use", () => {
  const players = {
    first: player("Blinky", true),
    second: player("pinky"),
    third: player("Alice"),
  };

  assert.equal(getRandomAvailableBotName(players, () => 0), "Inky");
  assert.equal(getRandomAvailableBotName(players, () => 0.999), "Chester");
});

test("never reuses a bot name when only one name remains", () => {
  const players = Object.fromEntries(
    BOT_NAMES.slice(0, -1).map((name, index) => [
      `player-${index}`,
      player(name, true),
    ]),
  );

  assert.equal(getRandomAvailableBotName(players), "Chester");
});

test("fails when every bot name is already in use", () => {
  const players = Object.fromEntries(
    BOT_NAMES.map((name, index) => [
      `player-${index}`,
      player(name, true),
    ]),
  );

  assert.throws(
    () => getRandomAvailableBotName(players),
    /no available bot names/i,
  );
});

test("creates Firebase-safe bot player IDs", () => {
  assert.equal(createBotPlayerUid(() => "1234-abcd"), "bot-1234-abcd");
});
