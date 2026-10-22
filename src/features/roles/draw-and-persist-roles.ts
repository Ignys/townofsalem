"use client";

import { createId } from "@/lib/utils/create-id";
import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import {
  readForcedRoles,
  readGamePlayers,
  readGameSettings,
  readPublicGame,
  readRoleHistory,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import { drawRoles, nextRoleHistory, type RandomSource } from "@/game-engine/draw-roles";
import { getRoleById, NEW_ROLE_IDS } from "@/data/roles";
import { withDefaultVariants } from "@/game-engine/variants";

import {
  getRandomRoleSlot,
  parseRandomRoleExclusions,
  RandomRoleResolutionError,
  resolveRandomRoles,
} from "./random-role-slots";
import { splitForcedRoles } from "./forced-roles";
import { compositionRecordToRoleIds } from "./role-composition";
import { ROLE_COMPOSITION_RULES } from "./role-composition-rules";
import { RoleAssignmentError } from "./role-assignment-error";
import { createRoleAssignmentUpdates } from "./role-assignment-updates";
import { getPlayerEntries } from "@/features/game-state/player-roster";
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
  let forcedRoles: Awaited<ReturnType<typeof readForcedRoles>>;
  let roleHistory: Awaited<ReturnType<typeof readRoleHistory>>;

  try {
    [game, settings, players, forcedRoles, roleHistory] = await Promise.all([
      readPublicGame(gameId),
      readGameSettings(gameId),
      readGamePlayers(gameId),
      readForcedRoles(gameId),
      readRoleHistory(gameId),
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

  // Everyone in the lobby is a participant: a locked phone or a backgrounded
  // tab drops the realtime socket and flips `disconnected`, but the person is
  // still sitting at the table waiting for a role.
  const participantUids = Object.keys(players ?? {});
  const roleIds = compositionRecordToRoleIds(settings?.roleComposition);
  const variants = withDefaultVariants(settings?.gameVariants);
  const validation = validateRoleComposition({
    roleIds,
    playerCount: participantUids.length,
    rules: { ...ROLE_COMPOSITION_RULES, enforceCardCounts: variants.compositionRespectsCardCount },
  });

  if (!validation.valid) {
    throw new RoleAssignmentError("invalid-composition", {
      validationErrors: validation.errors,
    });
  }

  // Random slots resolve here, on Play, and are only written as each player's
  // private role — the public composition keeps showing the slot.
  let resolvedRoleIds: string[];
  try {
    resolvedRoleIds = resolveRandomRoles(roleIds, {
      excludedRoleIds: [
        ...parseRandomRoleExclusions(settings?.randomRoleExclusions),
        ...(variants.disableNewRoles ? NEW_ROLE_IDS : []),
      ],
      respectCardCount: variants.compositionRespectsCardCount && variants.randomRolesRespectCardCount,
      random: options.random,
    });
  } catch (error: unknown) {
    if (!(error instanceof RandomRoleResolutionError)) throw error;
    throw new RoleAssignmentError("invalid-composition", {
      validationErrors: [{
        code: "random-pool-exhausted",
        message: `Não há roles suficientes para preencher todos os slots “${getRandomRoleSlot(error.slotId)?.name ?? error.slotId}”. Remova exclusões ou desative o limite de cartas.`,
        roleId: error.slotId,
      }],
    });
  }

  const split = splitForcedRoles(participantUids, roleIds, resolvedRoleIds, forcedRoles);
  if ("invalid" in split) {
    throw new RoleAssignmentError("invalid-composition", {
      validationErrors: [{
        code: "forced-role-unavailable",
        message: `A role “${getRoleById(split.invalid)?.name ?? split.invalid}” foi atribuída a mais jogadores do que existe na composição.`,
        roleId: split.invalid,
      }],
    });
  }

  const assignments = {
    ...drawRoles(split.remainingUids, split.remainingRoleIds, options.random, roleHistory ?? {}),
    ...split.forced,
  };
  const updates = createRoleAssignmentUpdates(
    gameId,
    assignments,
    (options.now ?? Date.now)(),
    {
      phaseSessionId: (options.createId ?? (() => createId()))(),
      nightId: (options.createId ?? (() => createId()))(),
    },
  );

  // Only players of this game are kept; whoever left the room drops out.
  // Bots nascem com casa; quem entrou pelo celular só tem se o mestre reordenou. Sem casa, cada tela numera de um jeito.
  let nextSeat = Math.max(0, ...Object.values(players ?? {}).map((player) => player.seat ?? 0));
  getPlayerEntries(players ?? {}).forEach(([uid, player]) => {
    if (!player.seat) updates[firebasePaths.gamePlayerField(gameId, uid, "seat")] = ++nextSeat;
  });

  updates[firebasePaths.gameRoleHistory(gameId)] = nextRoleHistory(assignments, roleHistory ?? {});

  try {
    await applyAtomicUpdate(updates);
  } catch (error: unknown) {
    throw new RoleAssignmentError("persistence-failed", {
      originalError: error,
    });
  }
}
