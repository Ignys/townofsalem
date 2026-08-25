"use client";

import { ensureAnonymousUser } from "@/features/auth";
import { firebaseAuth } from "@/lib/firebase/auth";
import {
  readPublicGame,
  readRoomCode,
  writePublicPlayer,
} from "@/lib/firebase/game-access-repository";
import type {
  GamePublicRecord,
  RoomCodeRecord,
} from "@/lib/firebase/schema";
import {
  isValidPlayerName,
  normalizePlayerName,
} from "@/lib/utils/player-name";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/utils/room-code";
import {
  PLAYER_EXPERIENCE_LEVELS,
  type PlayerExperience,
} from "@/types";

import { JoinGameError } from "./join-game-error";

export interface LocatedGame {
  code: string;
  gameId: string;
}

export interface JoinGameInput {
  code: string;
  nickname: string;
  experience: PlayerExperience;
}

function isPlayerExperience(value: string): value is PlayerExperience {
  return PLAYER_EXPERIENCE_LEVELS.some((level) => level === value);
}

async function ensureAuthenticatedUid(): Promise<string> {
  try {
    return (await ensureAnonymousUser(firebaseAuth)).uid;
  } catch (error: unknown) {
    throw new JoinGameError("authentication-failed", error);
  }
}

export async function locateJoinableGame(codeInput: string): Promise<LocatedGame> {
  await ensureAuthenticatedUid();

  const code = normalizeRoomCode(codeInput);

  if (!isValidRoomCode(code)) {
    throw new JoinGameError("invalid-code");
  }

  let roomCodeRecord: RoomCodeRecord | null;

  try {
    roomCodeRecord = await readRoomCode(code);
  } catch (error: unknown) {
    throw new JoinGameError("lookup-failed", error);
  }

  if (typeof roomCodeRecord !== "string") {
    throw new JoinGameError("game-not-found");
  }

  let publicGame: GamePublicRecord | null;

  try {
    publicGame = await readPublicGame(roomCodeRecord);
  } catch (error: unknown) {
    throw new JoinGameError("lookup-failed", error);
  }

  if (!publicGame || publicGame.code !== code) {
    throw new JoinGameError("game-not-found");
  }

  if (publicGame.status !== "lobby" || publicGame.phase !== "lobby") {
    throw new JoinGameError("game-not-joinable");
  }

  return { code, gameId: roomCodeRecord };
}

export async function joinGame(input: JoinGameInput): Promise<LocatedGame> {
  const uid = await ensureAuthenticatedUid();
  const nickname = normalizePlayerName(input.nickname);

  if (!isValidPlayerName(nickname)) {
    throw new JoinGameError("invalid-nickname");
  }

  if (!isPlayerExperience(input.experience)) {
    throw new JoinGameError("invalid-experience");
  }

  const locatedGame = await locateJoinableGame(input.code);

  try {
    await writePublicPlayer(locatedGame.gameId, uid, {
      name: nickname,
      alive: true,
      disconnected: false,
      experience: input.experience,
    });
  } catch (error: unknown) {
    throw new JoinGameError("persistence-failed", error);
  }

  return locatedGame;
}
