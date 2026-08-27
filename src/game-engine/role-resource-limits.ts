export type LimitedRoleResource =
  | "mayor-vote"
  | "investigator"
  | "consigliere"
  | "janitor"
  | "veteran-alert"
  | "vigilante-shot";

const RESOURCE_BY_ROLE: Readonly<Record<string, LimitedRoleResource>> = {
  mayor: "mayor-vote",
  investigator: "investigator",
  consigliere: "consigliere",
  janitor: "janitor",
  veteran: "veteran-alert",
  vigilante: "vigilante-shot",
};

export function getRoleResourceLimit(
  roleId: string,
  playerCount: number,
): number | null {
  if (!Number.isInteger(playerCount) || playerCount < 1) return null;
  const resource = RESOURCE_BY_ROLE[roleId] ?? roleId as LimitedRoleResource;
  const tier = playerCount >= 15 ? 2 : playerCount >= 10 ? 1 : 0;

  if (resource === "vigilante-shot") return [1, 2, 3][tier];
  if (Object.values(RESOURCE_BY_ROLE).includes(resource)) return [2, 3, 4][tier];
  return null;
}
