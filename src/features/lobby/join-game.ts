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
  /** Partida já começou: só dá para voltar a um lugar existente, com o mesmo nickname. */
  inProgress?: boolean;
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

  if (publicGame.status === "in-progress") {
    return { code, gameId: roomCodeRecord, inProgress: true };
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

  if (locatedGame.inProgress) {
    await rejoinGame(locatedGame.code, nickname);
    return locatedGame;
  }

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

/**
 * Volta a um lugar de uma partida em andamento: o servidor confere o nickname e devolve
 * um token do uid antigo, e esta sessão passa a ser aquele jogador.
 */
async function rejoinGame(code: string, nickname: string): Promise<void> {
  let response: Response;

  try {
    response = await fetch("/api/rejoin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, nickname }),
    });
  } catch (error: unknown) {
    throw new JoinGameError("lookup-failed", error);
  }

  const body = (await response.json().catch(() => ({}))) as { token?: string };

  if (!response.ok || !body.token) {
    throw new JoinGameError(response.status === 404 ? "seat-not-found" : "lookup-failed");
  }

  try {
    const { signInWithCustomToken } = await import("firebase/auth");
    await signInWithCustomToken(firebaseAuth, body.token);
  } catch (error: unknown) {
    throw new JoinGameError("authentication-failed", error);
  }
}
