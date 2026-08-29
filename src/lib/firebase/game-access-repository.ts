"use client";

import { get, set, type DataSnapshot } from "firebase/database";

import { firebasePaths, type FirebasePath } from "./paths";
import {
  toRealtimeDatabaseError,
  type RealtimeDatabaseOperation,
} from "./realtime-database-error";
import { getDatabaseReference } from "./references";
import type {
  DayVotesRecord,
  GamePublicRecord,
  GameSettingsRecord,
  GraveyardEntryRecord,
  PrivatePlayerRecord,
  PublicPlayerRecord,
  RoomCodeRecord,
} from "./schema";
import type { NightResolutionRecord, NightSession } from "@/types";

function snapshotValue<Value>(snapshot: DataSnapshot): Value | null {
  return snapshot.exists() ? (snapshot.val() as Value) : null;
}

async function readValue<Value>(
  operation: RealtimeDatabaseOperation,
  path: FirebasePath,
): Promise<Value | null> {
  try {
    return snapshotValue<Value>(await get(getDatabaseReference(path)));
  } catch (error: unknown) {
    throw toRealtimeDatabaseError(operation, path, error);
  }
}

export function readRoomCode(code: string): Promise<RoomCodeRecord | null> {
  const path = firebasePaths.roomCode(code);

  return readValue("read-room-code", path);
}

export function readPublicGame(
  gameId: string,
): Promise<GamePublicRecord | null> {
  const path = firebasePaths.gamePublic(gameId);

  return readValue("read-public-game", path);
}

export function readGameHostUid(gameId: string): Promise<string | null> {
  const path = firebasePaths.gameHostUid(gameId);

  return readValue("read-game-host", path);
}

export function readGameSettings(
  gameId: string,
): Promise<GameSettingsRecord | null> {
  const path = firebasePaths.gameSettings(gameId);

  return readValue("read-game-settings", path);
}

export function readGamePlayers(
  gameId: string,
): Promise<Record<string, PublicPlayerRecord> | null> {
  const path = firebasePaths.gamePlayers(gameId);

  return readValue("read-game-players", path);
}

export function readPublicPlayer(
  gameId: string,
  uid: string,
): Promise<PublicPlayerRecord | null> {
  const path = firebasePaths.gamePlayer(gameId, uid);

  return readValue("read-public-player", path);
}

export function readGameDayVotes(
  gameId: string,
  dayNumber: number,
): Promise<DayVotesRecord | null> {
  const path = firebasePaths.gameDayVotes(gameId, dayNumber);

  return readValue("read-day-votes", path);
}

export function readNightSession(
  gameId: string,
  nightId: string,
): Promise<NightSession | null> {
  return readValue("read-night-session", firebasePaths.gameNightSession(gameId, nightId));
}

export function readNightResolution(
  gameId: string,
  nightId: string,
): Promise<NightResolutionRecord | null> {
  return readValue("read-night-resolution", firebasePaths.gameNightResolution(gameId, nightId));
}

export function readHostPrivatePlayer(
  gameId: string,
  uid: string,
): Promise<PrivatePlayerRecord | null> {
  return readValue("read-host-private-player", firebasePaths.gamePrivatePlayer(gameId, uid));
}

export function readGraveyardEntry(
  gameId: string,
  uid: string,
): Promise<GraveyardEntryRecord | null> {
  return readValue("read-graveyard-entry", firebasePaths.gameGraveyardEntry(gameId, uid));
}

export function readHostPrivatePlayers(
  gameId: string,
): Promise<Record<string, PrivatePlayerRecord> | null> {
  return readValue("read-host-private-players", firebasePaths.gamePrivatePlayers(gameId));
}

export async function writePublicPlayer(
  gameId: string,
  uid: string,
  player: PublicPlayerRecord,
): Promise<void> {
  const path = firebasePaths.gamePlayer(gameId, uid);

  try {
    await set(getDatabaseReference(path), player);
  } catch (error: unknown) {
    throw toRealtimeDatabaseError("write-public-player", path, error);
  }
}
