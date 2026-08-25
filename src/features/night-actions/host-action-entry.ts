import type {
  HostNightActionEntry,
  Player,
  RoleActionDefinition,
  RoleDefinition,
} from "@/types";

export interface HostActionContext {
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  roleDefinitions: readonly RoleDefinition[];
}

export interface ResolvedHostActionEntry {
  actor: Player;
  targets: readonly Player[];
  role: RoleDefinition;
  action: RoleActionDefinition;
}

export function isBasicHostActionEntry(value: unknown): value is HostNightActionEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<HostNightActionEntry>;

  return (
    typeof entry.id === "string" &&
    typeof entry.nightId === "string" &&
    typeof entry.actorUid === "string" &&
    typeof entry.roleIdSnapshot === "string" &&
    typeof entry.actionId === "string" &&
    Array.isArray(entry.targetUids) &&
    entry.targetUids.every((uid) => typeof uid === "string") &&
    typeof entry.createdAt === "number" &&
    typeof entry.updatedAt === "number" &&
    ["draft", "confirmed", "cancelled"].includes(entry.status ?? "")
  );
}

export function getHostActionDefinition(
  entry: HostNightActionEntry,
  roles: readonly RoleDefinition[],
): RoleActionDefinition | undefined {
  const role = roles.find(({ id }) => id === entry.roleIdSnapshot);
  return role?.actionDefinitions?.find(({ id }) => id === entry.actionId) ??
    (role?.action?.id === entry.actionId ? role.action : undefined);
}

export function resolveHostActionEntry(
  entry: HostNightActionEntry,
  context: HostActionContext,
): ResolvedHostActionEntry | undefined {
  const actor = context.players.find(({ uid }) => uid === entry.actorUid);
  const role = context.roleDefinitions.find(({ id }) => id === entry.roleIdSnapshot);
  const action = getHostActionDefinition(entry, context.roleDefinitions);
  const targets = entry.targetUids.map((uid) => context.players.find((player) => player.uid === uid));

  if (!actor || !role || !action || targets.some((target) => !target)) return undefined;

  return { actor, role, action, targets: targets as Player[] };
}

export function formatHostActionEntry(
  entry: HostNightActionEntry,
  context: HostActionContext,
): string {
  const resolved = resolveHostActionEntry(entry, context);

  if (!resolved) return "Ação incompleta ou com referência inválida";

  const targets = resolved.targets.map(({ name }) => name).join(", ");
  return [
    resolved.actor.name,
    resolved.role.name,
    resolved.action.verb,
    targets,
  ].filter(Boolean).join(" — ");
}
