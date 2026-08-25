import { getRoleById } from "@/data/roles";
import type { RoleAssignmentMap } from "@/game-engine/draw-roles";
import { firebasePaths } from "@/lib/firebase/paths";
import type { AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";

export function createRoleAssignmentUpdates(
  gameId: string,
  assignments: RoleAssignmentMap,
  assignedAt: number,
): AtomicUpdateMap {
  const updates: AtomicUpdateMap = {
    [firebasePaths.gamePublicField(gameId, "status")]: "in-progress",
    [firebasePaths.gameSettingsField(gameId, "rolesAssignedAt")]: assignedAt,
  };

  Object.entries(assignments).forEach(([playerUid, roleId]) => {
    const role = getRoleById(roleId);

    if (!role) {
      throw new Error("A role assignment contains an unknown catalog ID.");
    }

    updates[firebasePaths.gamePrivatePlayer(gameId, playerUid)] = {
      roleId: role.id,
      faction: role.faction,
    };
  });

  return updates;
}
