import type { PublicPlayerRecord } from "@/lib/firebase/schema";

import { BOT_NAMES } from "./bot-names";

export function getRandomAvailableBotName(
  players: Readonly<Record<string, PublicPlayerRecord>>,
  random: () => number = Math.random,
): string {
  const existingNames = new Set(
    Object.values(players).map((player) =>
      player.name.toLocaleLowerCase("pt-BR"),
    ),
  );
  const availableNames = BOT_NAMES.filter(
    (name) => !existingNames.has(name.toLocaleLowerCase("pt-BR")),
  );

  if (availableNames.length === 0) {
    throw new Error("There are no available bot names.");
  }

  return availableNames[Math.floor(random() * availableNames.length)];
}

export function createBotPlayerUid(randomUuid: () => string): string {
  return `bot-${randomUuid()}`;
}
