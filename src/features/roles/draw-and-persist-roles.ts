"use client";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import {
  readGamePlayers,
  readGameSettings,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import { drawRoles, type RandomSource } from "@/game-engine/draw-roles";

import { compositionRecordToRoleIds } from "./role-composition";
import { RoleAssignmentError } from "./role-assignment-error";
import { createRoleAssignmentUpdates } from "./role-assignment-updates";
import { validateRoleComposition } from "./validate-role-composition";

export interface DrawAndPersistRolesOptions {
  random?: RandomSource;
  now?: () => number;
  createId?: () => string;
}

export async function drawAndPersistRoles(
  gameId: string,
  options: DrawAndPersistRolesOptions = {},
): Promise<void> {
  try {
    await requireAuthenticatedGameHost(gameId);
  } catch (error: unknown) {
    throw new RoleAssignmentError("not-host", { originalError: error });
  }

  let game: Awaited<ReturnType<typeof readPublicGame>>;
  let settings: Awaited<ReturnType<typeof readGameSettings>>;
  let players: Awaited<ReturnType<typeof readGamePlayers>>;

  try {
    [game, settings, players] = await Promise.all([
      readPublicGame(gameId),
      readGameSettings(gameId),
      readGamePlayers(gameId),
    ]);
  } catch (error: unknown) {
    throw new RoleAssignmentError("game-unavailable", {
      originalError: error,
    });
  }

  if (!game) {
    throw new RoleAssignmentError("game-unavailable");
  }

  if (
    game.status !== "lobby" ||
    game.phase !== "lobby" ||
    settings?.rolesAssignedAt !== undefined
  ) {
    throw new RoleAssignmentError("roles-already-assigned");
  }

  const participantUids = Object.entries(players ?? {})
    .filter(([, player]) => !player.disconnected)
    .map(([playerUid]) => playerUid);
  const roleIds = compositionRecordToRoleIds(settings?.roleComposition);
  const validation = validateRoleComposition({
    roleIds,
    playerCount: participantUids.length,
  });

  if (!validation.valid) {
    throw new RoleAssignmentError("invalid-composition", {
      validationErrors: validation.errors,
    });
  }

  const assignments = drawRoles(
    participantUids,
    roleIds,
    options.random,
  );
  const updates = createRoleAssignmentUpdates(
    gameId,
    assignments,
    (options.now ?? Date.now)(),
    {
      phaseSessionId: (options.createId ?? (() => crypto.randomUUID()))(),
      nightId: (options.createId ?? (() => crypto.randomUUID()))(),
    },
  );

  try {
    await applyAtomicUpdate(updates);
  } catch (error: unknown) {
    throw new RoleAssignmentError("persistence-failed", {
      originalError: error,
    });
  }
}
