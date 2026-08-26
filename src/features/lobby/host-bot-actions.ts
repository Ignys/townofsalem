"use client";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import {
  readGamePlayers,
  readPublicGame,
  readPublicPlayer,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import {
  isValidPlayerName,
  normalizePlayerName,
} from "@/lib/utils/player-name";

import {
  createBotPlayerUid,
  getRandomAvailableBotName,
} from "./bot-player";

export async function addBotPlayer(gameId: string): Promise<void> {
  await requireAuthenticatedGameHost(gameId);

  const [game, storedPlayers] = await Promise.all([
    readPublicGame(gameId),
    readGamePlayers(gameId),
  ]);

  if (game?.status !== "lobby" || game.phase !== "lobby") {
    throw new Error("Bots can only be added while the game is in the lobby.");
  }

  const players = storedPlayers ?? {};
  const nextSeat =
    Math.max(
      0,
      ...Object.values(players).map((player) => player.seat ?? 0),
    ) + 1;
  const botUid = createBotPlayerUid(() => crypto.randomUUID());

  await applyAtomicUpdate({
    [firebasePaths.gamePlayer(gameId, botUid)]: {
      name: getRandomAvailableBotName(players),
      isBot: true,
      alive: true,
      disconnected: false,
      experience: "experienced",
      seat: nextSeat,
    },
  });
}

export async function renameBotPlayer(
  gameId: string,
  playerUid: string,
  nameInput: string,
): Promise<void> {
  await requireAuthenticatedGameHost(gameId);

  const name = normalizePlayerName(nameInput);

  if (!isValidPlayerName(name)) {
    throw new Error("The bot name is invalid.");
  }

  const player = await readPublicPlayer(gameId, playerUid);

  if (!player?.isBot) {
    throw new Error("Only bot players can be renamed by this action.");
  }

  if (player.name === name) {
    return;
  }

  await applyAtomicUpdate({
    [firebasePaths.gamePlayerField(gameId, playerUid, "name")]: name,
  });
}
