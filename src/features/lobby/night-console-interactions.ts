import { VAMPIRE_COOLDOWN_STATUS } from "@/game-engine/resolve-night";
import { canUseActionOnNight, getChosenExecutionTarget } from "@/game-engine/role-rules";
import { withDefaultVariants, type GameVariants } from "@/game-engine/variants";
import type {
  HostNightActionEntry,
  Player,
  RoleActionDefinition,
  RoleDefinition,
} from "@/types";

export interface NightConsoleInteraction {
  id: string;
  actor: Player;
  role: RoleDefinition;
  action: RoleActionDefinition;
}

export function getNightConsoleInteractions(
  players: readonly Player[],
  assignments: Readonly<Record<string, string>>,
  roleDefinitions: readonly RoleDefinition[],
  nightNumber: number,
  variants?: Partial<GameVariants>,
): readonly NightConsoleInteraction[] {
  const rolesById = new Map(roleDefinitions.map((role) => [role.id, role]));
  const playersWithRoles = players.map((player) => ({
    ...player,
    roleId: assignments[player.uid],
  }));
  return players.flatMap((actor) => {
    const role = rolesById.get(assignments[actor.uid] ?? "");

    if (
      !actor.alive ||
      !role?.wakesAtNight ||
      role.id === "deputy"
    ) {
      return [];
    }

    const actions = role.actionDefinitions ?? (role.action ? [role.action] : []);

    return actions
      .filter((action) => canUseActionOnNight(action, nightNumber))
      // O Executioner escolhe o alvo em qualquer noite, mas só até escolher.
      .filter((action) => action.id !== "choose-execution-target" || !getChosenExecutionTarget(actor.statuses))
      // Depois de uma conversão, os Vampiros passam a noite seguinte sem morder.
      .filter((action) => action.id !== "vampire-bite-vote"
        || !actor.statuses?.some((status) => (typeof status === "string" ? status : status.type) === VAMPIRE_COOLDOWN_STATUS))
      .map((action) => ({
        id: `${actor.uid}:${action.id}`,
        actor,
        role,
        action: role.id === "godfather"
          && action.id === "mafia-kill-vote"
          && withDefaultVariants(variants).godfatherDoubleKillWhenLastMafia
          && playersWithRoles.filter(
            (player) => player.alive && roleDefinitions.find(({ id }) => id === player.roleId)?.faction === "mafia",
          ).length === 1
            ? { ...action, targetCount: 2 }
            : action,
      }));
  }).sort(
    (left, right) =>
      (left.role.wakeOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.role.wakeOrder ?? Number.MAX_SAFE_INTEGER) ||
      (left.action.priority ?? Number.MAX_SAFE_INTEGER) -
        (right.action.priority ?? Number.MAX_SAFE_INTEGER) ||
      (left.actor.seat ?? Number.MAX_SAFE_INTEGER) -
        (right.actor.seat ?? Number.MAX_SAFE_INTEGER) ||
      left.actor.name.localeCompare(right.actor.name, "pt-BR"),
  );
}

export function getAvailableNightTargets(
  interaction: NightConsoleInteraction,
  players: readonly Player[],
  variants?: Partial<GameVariants>,
): readonly Player[] {
  const { action, actor } = interaction;
  const allowDoctorSelf = interaction.role.id === "doctor"
    && withDefaultVariants(variants).doctorCanSelfHealOnce;

  // O Doctor não cura um Mayor revelado, então ele nem aparece como alvo.
  const blocksRevealedMayor = interaction.role.id === "doctor";

  return players.filter(
    (player) =>
      (!blocksRevealedMayor || !player.statuses?.some(({ type }) => type === "mayor-revealed")) &&
      (action.allowSelfTarget || allowDoctorSelf || player.uid !== actor.uid) &&
      (action.allowDeadTarget || player.alive) &&
      (!action.requireDeadTarget || !player.alive),
  );
}

export function getLatestNightConsoleEntry(
  interaction: NightConsoleInteraction,
  entries: readonly HostNightActionEntry[],
): HostNightActionEntry | undefined {
  return entries
    .filter(
      (entry) =>
        entry.actorUid === interaction.actor.uid &&
        entry.actionId === interaction.action.id,
    )
    .sort(
      (left, right) =>
        right.updatedAt - left.updatedAt || right.id.localeCompare(left.id),
    )[0];
}
