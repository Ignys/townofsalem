"use client";

import { ensureAnonymousUser } from "@/features/auth";
import { firebaseAuth } from "@/lib/firebase/auth";
import {
  readPublicGame,
  readPublicPlayer,
  readRoomCode,
} from "@/lib/firebase/game-access-repository";
import type {
  GamePublicRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/utils/room-code";

import { RestorePlayerSessionError } from "./restore-player-session-error";

export interface RestoredPlayerSession {
  code: string;
  gameId: string;
  uid: string;
  game: GamePublicRecord;
  player: PublicPlayerRecord;
}

export async function restorePlayerSession(
  codeInput: string,
): Promise<RestoredPlayerSession> {
  let uid: string;

  try {
    uid = (await ensureAnonymousUser(firebaseAuth)).uid;
  } catch (error: unknown) {
    throw new RestorePlayerSessionError("authentication-failed", error);
  }

  const code = normalizeRoomCode(codeInput);

  if (!isValidRoomCode(code)) {
    throw new RestorePlayerSessionError("invalid-code");
  }

  let gameId: string | null;

  try {
    const roomCodeRecord = await readRoomCode(code);
    gameId = typeof roomCodeRecord === "string" ? roomCodeRecord : null;
  } catch (error: unknown) {
    throw new RestorePlayerSessionError("lookup-failed", error);
  }

  if (!gameId) {
    throw new RestorePlayerSessionError("game-not-found");
  }

  let game: GamePublicRecord | null;
  let player: PublicPlayerRecord | null;

  try {
    [game, player] = await Promise.all([
      readPublicGame(gameId),
      readPublicPlayer(gameId, uid),
    ]);
  } catch (error: unknown) {
    throw new RestorePlayerSessionError("lookup-failed", error);
  }

  if (!game || game.code !== code) {
    throw new RestorePlayerSessionError("game-not-found");
  }

  if (!player) {
    throw new RestorePlayerSessionError("player-removed");
  }

  return { code, gameId, uid, game, player };
}
