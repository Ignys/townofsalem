"use client";

import { runTransaction } from "firebase/database";

import { firebasePaths } from "./paths";
import { toRealtimeDatabaseError } from "./realtime-database-error";
import { getRoomCodeReference } from "./references";
import type { RoomCodeReservation } from "./schema";

function isOwnedReservation(
  value: unknown,
  expected: RoomCodeReservation,
): value is RoomCodeReservation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const reservation = value as Partial<RoomCodeReservation>;

  return (
    reservation.gameId === expected.gameId &&
    reservation.reservedByUid === expected.reservedByUid
  );
}

export async function reserveRoomCode(
  code: string,
  reservation: RoomCodeReservation,
): Promise<boolean> {
  const path = firebasePaths.roomCode(code);

  try {
    const result = await runTransaction(
      getRoomCodeReference(code),
      (currentValue: unknown) =>
        currentValue === null ? reservation : undefined,
      { applyLocally: false },
    );

    return result.committed;
  } catch (error: unknown) {
    throw toRealtimeDatabaseError("reserve-room-code", path, error);
  }
}

export async function releaseRoomCodeReservation(
  code: string,
  reservation: RoomCodeReservation,
): Promise<void> {
  const path = firebasePaths.roomCode(code);

  try {
    await runTransaction(
      getRoomCodeReference(code),
      (currentValue: unknown) =>
        isOwnedReservation(currentValue, reservation) ? null : undefined,
      { applyLocally: false },
    );
  } catch (error: unknown) {
    throw toRealtimeDatabaseError("release-room-code", path, error);
  }
}
