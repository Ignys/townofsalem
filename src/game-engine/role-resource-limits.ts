export type LimitedRoleResource =
  | "mayor-vote"
  | "investigator"
  | "consigliere"
  | "janitor"
  | "veteran-alert"
  | "vigilante-shot";

export type MediumClueCandidateCount = 2 | 3 | 4;

const RESOURCE_BY_ROLE: Readonly<Record<string, LimitedRoleResource>> = {
  mayor: "mayor-vote",
  investigator: "investigator",
  consigliere: "consigliere",
  janitor: "janitor",
  veteran: "veteran-alert",
  vigilante: "vigilante-shot",
};

function getPlayerCountTier(playerCount: number): 0 | 1 | 2 | null {
  if (!Number.isInteger(playerCount) || playerCount < 1) return null;
  return playerCount >= 15 ? 2 : playerCount >= 10 ? 1 : 0;
}

export function getRoleResourceLimit(
  roleId: string,
  playerCount: number,
): number | null {
  const tier = getPlayerCountTier(playerCount);
  if (tier === null) return null;
  const resource = RESOURCE_BY_ROLE[roleId] ?? roleId as LimitedRoleResource;

  if (resource === "vigilante-shot") return [1, 2, 3][tier];
  if (Object.values(RESOURCE_BY_ROLE).includes(resource)) return [2, 3, 4][tier];
  return null;
}

export function getMediumClueCandidateCount(
  playerCount: number,
): MediumClueCandidateCount | null {
  const tier = getPlayerCountTier(playerCount);
  return tier === null ? null : ([2, 3, 4] as const)[tier];
}
