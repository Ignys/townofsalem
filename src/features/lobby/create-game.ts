"use client";

import { ensureAnonymousUser } from "@/features/auth";
import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import {
  releaseRoomCodeReservation,
  reserveRoomCode,
} from "@/lib/firebase/room-code-repository";
import type {
  GamePublicRecord,
  RoomCodeReservation,
} from "@/lib/firebase/schema";
import { generateRoomCode } from "@/lib/utils/room-code";

import { CreateGameError } from "./create-game-error";

const MAX_ROOM_CODE_ATTEMPTS = 12;

export interface CreateGameResult {
  code: string;
  gameId: string;
}

function createInitialPublicGame(code: string): GamePublicRecord {
  return {
    code,
    status: "lobby",
    phase: "lobby",
    day: 0,
    phaseEndsAt: null,
    timerPaused: false,
    timerRemainingMs: null,
  };
}

async function reserveAvailableCode(
  gameId: string,
  uid: string,
): Promise<{ code: string; reservation: RoomCodeReservation }> {
  const reservation = { gameId, reservedByUid: uid };

  for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt += 1) {
    const code = generateRoomCode();

    if (await reserveRoomCode(code, reservation)) {
      return { code, reservation };
    }
  }

  throw new CreateGameError("code-generation-exhausted");
}

export async function createGame(): Promise<CreateGameResult> {
  let uid: string;

  try {
    uid = (await ensureAnonymousUser(firebaseAuth)).uid;
  } catch (error: unknown) {
    throw new CreateGameError("authentication-failed", error);
  }

  const gameId = globalThis.crypto.randomUUID();
  let reservedCode: Awaited<ReturnType<typeof reserveAvailableCode>>;

  try {
    reservedCode = await reserveAvailableCode(gameId, uid);
  } catch (error: unknown) {
    if (error instanceof CreateGameError) {
      throw error;
    }

    throw new CreateGameError("persistence-failed", error);
  }

  const { code, reservation } = reservedCode;

  try {
    await applyAtomicUpdate({
      [firebasePaths.roomCode(code)]: gameId,
      [firebasePaths.gameHostUid(gameId)]: uid,
      [firebasePaths.gamePublic(gameId)]: createInitialPublicGame(code),
    });
  } catch (error: unknown) {
    try {
      await releaseRoomCodeReservation(code, reservation);
    } catch {
      // Cleanup is best-effort; another UID cannot finalize this reservation.
    }

    throw new CreateGameError("persistence-failed", error);
  }

  return { code, gameId };
}
