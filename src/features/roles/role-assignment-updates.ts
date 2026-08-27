import { getRoleById } from "@/data/roles";
import type { RoleAssignmentMap } from "@/game-engine/draw-roles";
import { firebasePaths } from "@/lib/firebase/paths";
import type { AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";
import { createPhaseSession } from "@/features/game-state/create-phase-session";

export interface InitialNightIdentifiers {
  phaseSessionId: string;
  nightId: string;
}

export function createRoleAssignmentUpdates(
  gameId: string,
  assignments: RoleAssignmentMap,
  assignedAt: number,
  identifiers: InitialNightIdentifiers,
): AtomicUpdateMap {
  const initialNight = createPhaseSession({}, {
    phaseId: "night",
    label: "Noite",
    durationSeconds: null,
    startedAt: assignedAt,
    phaseSessionId: identifiers.phaseSessionId,
    nightId: identifiers.nightId,
  });
  const updates: AtomicUpdateMap = {
    [firebasePaths.gamePublicField(gameId, "status")]: "in-progress",
    [firebasePaths.gamePublicField(gameId, "phase")]: initialNight.phase,
    [firebasePaths.gamePublicField(gameId, "phaseLabel")]: initialNight.phaseSession.label,
    [firebasePaths.gamePublicField(gameId, "phaseSessionId")]: identifiers.phaseSessionId,
    [firebasePaths.gamePublicField(gameId, "currentNightId")]: identifiers.nightId,
    [firebasePaths.gamePublicField(gameId, "phaseSequenceNumber")]: initialNight.nextPhaseSequenceNumber,
    [firebasePaths.gamePublicField(gameId, "nightNumber")]: initialNight.nextNightNumber,
    [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]: null,
    [firebasePaths.gamePublicField(gameId, "timerPaused")]: false,
    [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]: null,
    [firebasePaths.gameSettingsField(gameId, "rolesAssignedAt")]: assignedAt,
    [firebasePaths.gamePhaseSession(gameId, identifiers.phaseSessionId)]: initialNight.phaseSession,
    [firebasePaths.gameNightSession(gameId, identifiers.nightId)]: initialNight.nightSession!,
  };

  Object.entries(assignments).forEach(([playerUid, roleId]) => {
    const role = getRoleById(roleId);

    if (!role) {
      throw new Error("A role assignment contains an unknown catalog ID.");
    }

    updates[firebasePaths.gamePrivatePlayer(gameId, playerUid)] = {
      roleId: role.id,
      originalRoleId: role.id,
      faction: role.faction,
    };
  });

  return updates;
}
