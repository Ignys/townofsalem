import { getRoleResourceLimit } from "@/game-engine/role-resource-limits";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";
import type { HostNightActionEntry } from "@/types";

interface TrackedRoleResource {
  actionId?: string;
  label: string;
  resourceId: string;
}

export interface RoleResourceUsage {
  label: string;
  limit: number;
  remaining: number;
  used: number;
}

const TRACKED_ROLE_RESOURCES: Readonly<Record<string, TrackedRoleResource>> = {
  investigator: {
    actionId: "investigate-exact-role",
    label: "investigações",
    resourceId: "investigator",
  },
  consigliere: {
    actionId: "investigate-exact-role",
    label: "investigações",
    resourceId: "consigliere",
  },
  janitor: {
    label: "limpezas",
    resourceId: "janitor",
  },
  veteran: {
    actionId: "alert",
    label: "alertas",
    resourceId: "veteran-alert",
  },
  vigilante: {
    actionId: "shoot",
    label: "tiros",
    resourceId: "vigilante-shot",
  },
};

interface GetRoleResourceUsageOptions {
  actionEntries: readonly HostNightActionEntry[];
  assignment?: PrivatePlayerRecord;
  playerCount: number;
  playerUid: string;
  roleId: string;
}

export function getRoleResourceUsage({
  actionEntries,
  assignment,
  playerCount,
  playerUid,
  roleId,
}: GetRoleResourceUsageOptions): RoleResourceUsage | null {
  const trackedResource = TRACKED_ROLE_RESOURCES[roleId];
  const limit = getRoleResourceLimit(roleId, playerCount);

  if (!trackedResource || limit === null) return null;

  const used = trackedResource.actionId
    ? actionEntries.filter(
        (entry) =>
          entry.status === "confirmed" &&
          entry.actorUid === playerUid &&
          entry.actionId === trackedResource.actionId,
      ).length
    : assignment?.resourceUses?.[trackedResource.resourceId] ?? 0;

  return {
    label: trackedResource.label,
    limit,
    remaining: Math.max(0, limit - used),
    used,
  };
}
