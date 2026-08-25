"use client";

import { firebaseAuth } from "@/lib/firebase/auth";
import { readGameHostUid } from "@/lib/firebase/game-access-repository";

export class GameHostAuthorizationError extends Error {
  readonly originalError?: unknown;

  constructor(originalError?: unknown) {
    super("The authenticated user is not the verified game host.");
    this.name = "GameHostAuthorizationError";
    this.originalError = originalError;
  }
}

export async function requireAuthenticatedGameHost(
  gameId: string,
): Promise<string> {
  const authenticatedUid = firebaseAuth.currentUser?.uid;

  if (!authenticatedUid) {
    throw new GameHostAuthorizationError();
  }

  let hostUid: string | null;

  try {
    hostUid = await readGameHostUid(gameId);
  } catch (error: unknown) {
    throw new GameHostAuthorizationError(error);
  }

  if (hostUid !== authenticatedUid) {
    throw new GameHostAuthorizationError();
  }

  return authenticatedUid;
}
