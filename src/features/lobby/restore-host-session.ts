"use client";

import { ensureAnonymousUser } from "@/features/auth";
import { firebaseAuth } from "@/lib/firebase/auth";
import {
  readGameHostUid,
  readPublicGame,
  readRoomCode,
} from "@/lib/firebase/game-access-repository";
import type { GamePublicRecord } from "@/lib/firebase/schema";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/utils/room-code";

import { RestoreHostSessionError } from "./restore-host-session-error";

export interface RestoredHostSession {
  code: string;
  gameId: string;
  uid: string;
  game: GamePublicRecord;
}

export async function restoreHostSession(
  codeInput: string,
): Promise<RestoredHostSession> {
  let uid: string;

  try {
    uid = (await ensureAnonymousUser(firebaseAuth)).uid;
  } catch (error: unknown) {
    throw new RestoreHostSessionError("authentication-failed", error);
  }

  const code = normalizeRoomCode(codeInput);

  if (!isValidRoomCode(code)) {
    throw new RestoreHostSessionError("invalid-code");
  }

  let gameId: string | null;

  try {
    const roomCodeRecord = await readRoomCode(code);
    gameId = typeof roomCodeRecord === "string" ? roomCodeRecord : null;
  } catch (error: unknown) {
    throw new RestoreHostSessionError("lookup-failed", error);
  }

  if (!gameId) {
    throw new RestoreHostSessionError("game-not-found");
  }

  let game: GamePublicRecord | null;

  try {
    game = await readPublicGame(gameId);
  } catch (error: unknown) {
    throw new RestoreHostSessionError("lookup-failed", error);
  }

  if (!game || game.code !== code) {
    throw new RestoreHostSessionError("game-not-found");
  }

  let hostUid: string | null;

  try {
    hostUid = await readGameHostUid(gameId);
  } catch (error: unknown) {
    throw new RestoreHostSessionError("not-host", error);
  }

  if (hostUid !== uid) {
    throw new RestoreHostSessionError("not-host");
  }

  return { code, gameId, uid, game };
}
