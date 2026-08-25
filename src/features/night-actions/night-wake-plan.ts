import type { Player, RoleDefinition } from "@/types";
import { canUseActionOnNight } from "@/game-engine/role-rules";

export interface NightAssignment {
  playerUid: string;
  roleId: string;
}

export interface NightWakeMember {
  playerUid: string;
  playerName: string;
  roleId: string;
  roleName: string;
}

export interface NightWakeItem {
  id: string;
  label: string;
  wakeOrder: number;
  groupId?: string;
  members: readonly NightWakeMember[];
}

export interface GenerateNightWakePlanOptions {
  includeDead?: boolean;
  nightNumber?: number;
  includePlayer?: (player: Player, role: RoleDefinition) => boolean;
}

interface PendingWakeItem {
  groupId?: string;
  groupLabel?: string;
  wakeOrder: number;
  member: NightWakeMember;
}

function compareMembers(left: NightWakeMember, right: NightWakeMember) {
  return (
    left.playerName.localeCompare(right.playerName, "pt-BR") ||
    left.playerUid.localeCompare(right.playerUid)
  );
}

export function generateNightWakePlan(
  players: readonly Player[],
  assignments: readonly NightAssignment[],
  roleDefinitions: readonly RoleDefinition[],
  options: GenerateNightWakePlanOptions = {},
): readonly NightWakeItem[] {
  const rolesById = new Map(roleDefinitions.map((role) => [role.id, role]));
  const assignmentsByUid = new Map(
    assignments.map((assignment) => [assignment.playerUid, assignment.roleId]),
  );
  const pending: PendingWakeItem[] = [];

  for (const player of players) {
    if (!options.includeDead && !player.alive) {
      continue;
    }

    const roleId = assignmentsByUid.get(player.uid);
    const role = roleId ? rolesById.get(roleId) : undefined;

    if (!role?.wakesAtNight || options.includePlayer?.(player, role) === false) {
      continue;
    }

    const actions = role.actionDefinitions ?? (role.action ? [role.action] : []);
    if (
      options.nightNumber !== undefined &&
      !role.wakeGroupId &&
      actions.length > 0 &&
      !actions.some((action) => canUseActionOnNight(action, options.nightNumber!))
    ) {
      continue;
    }

    pending.push({
      groupId: role.wakeGroupId,
      groupLabel: role.wakeGroupLabel,
      wakeOrder: role.wakeOrder ?? Number.MAX_SAFE_INTEGER,
      member: {
        playerUid: player.uid,
        playerName: player.name,
        roleId: role.id,
        roleName: role.name,
      },
    });
  }

  const grouped = new Map<string, PendingWakeItem[]>();

  for (const item of pending) {
    const key = item.groupId ? `group:${item.groupId}` : `player:${item.member.playerUid}`;
    const group = grouped.get(key) ?? [];
    group.push(item);
    grouped.set(key, group);
  }

  return [...grouped.entries()]
    .map(([key, group]) => {
      const members = group.map(({ member }) => member).sort(compareMembers);
      const first = group[0];
      const groupLabel = first.groupLabel ?? first.groupId;

      return {
        id: key,
        label: groupLabel ?? `${members[0].playerName} — ${members[0].roleName}`,
        wakeOrder: Math.min(...group.map(({ wakeOrder }) => wakeOrder)),
        groupId: first.groupId,
        members,
      } satisfies NightWakeItem;
    })
    .sort(
      (left, right) =>
        left.wakeOrder - right.wakeOrder ||
        left.label.localeCompare(right.label, "pt-BR") ||
        left.id.localeCompare(right.id),
    );
}
