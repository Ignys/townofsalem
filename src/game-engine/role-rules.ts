import type { Player, RoleActionDefinition } from "@/types";
import { getRoleResourceLimit } from "./role-resource-limits";

export type ForcedVerdict = "guilty" | "innocent" | null;

export function getForcedVerdict(roleId: string): ForcedVerdict {
  if (roleId === "peaceful-townie") return "innocent";
  if (roleId === "spiteful-townie") return "guilty";
  return null;
}

export function getVerdictVoteWeight(
  roleId: string,
  statuses: readonly string[],
  playerCount = 9,
): number {
  return roleId === "mayor" && statuses.includes("mayor-revealed")
    ? getRoleResourceLimit("mayor", playerCount) ?? 1
    : 1;
}

export function canReceiveDoctorProtection(
  roleId: string,
  statuses: readonly string[],
): boolean {
  return roleId !== "mayor" || !statuses.includes("mayor-revealed");
}

export function getJesterRevengeTargets(
  votes: Readonly<Record<string, "guilty" | "innocent" | "abstain">>,
): readonly string[] {
  return Object.entries(votes)
    .filter(([, vote]) => vote === "guilty")
    .map(([playerUid]) => playerUid)
    .sort();
}

export function executionerBecomesJester(
  targetDeathCause: "night" | "hanging" | "other-day",
): boolean | null {
  if (targetDeathCause === "night") return true;
  if (targetDeathCause === "hanging") return false;
  return null;
}

export function canUseActionOnNight(
  action: RoleActionDefinition,
  nightNumber: number,
): boolean {
  if (action.availableOnNight !== undefined) {
    return nightNumber === action.availableOnNight;
  }
  if (
    action.availableFromNight !== undefined &&
    nightNumber < action.availableFromNight
  ) {
    return false;
  }
  return !action.evenNightsOnly || nightNumber % 2 === 0;
}

export function arePlayersAdjacent(
  left: Pick<Player, "uid" | "seat">,
  right: Pick<Player, "uid" | "seat">,
  players: readonly (Pick<Player, "uid" | "seat"> & Partial<Pick<Player, "alive">>)[],
): boolean {
  if (
    left.uid === right.uid ||
    left.seat === undefined ||
    right.seat === undefined
  ) {
    return false;
  }

  const occupiedSeats = [...new Set(
    players
      .filter((player) => player.alive !== false)
      .map((player) => player.seat)
      .filter((seat): seat is number => seat !== undefined),
  )].sort((a, b) => a - b);
  const leftIndex = occupiedSeats.indexOf(left.seat);
  const rightIndex = occupiedSeats.indexOf(right.seat);

  if (leftIndex < 0 || rightIndex < 0 || occupiedSeats.length < 2) return false;

  const distance = Math.abs(leftIndex - rightIndex);
  return distance === 1 || distance === occupiedSeats.length - 1;
}

export function resolveMafiaVoteTarget(
  votes: Readonly<Record<string, string>>,
  godfatherUid?: string,
  tieBreakSeed?: string,
): string | null {
  const counts = new Map<string, number>();
  Object.values(votes).forEach((targetUid) =>
    counts.set(targetUid, (counts.get(targetUid) ?? 0) + 1),
  );

  if (counts.size === 0) return null;

  const highestCount = Math.max(...counts.values());
  const tiedTargets = [...counts.entries()]
    .filter(([, count]) => count === highestCount)
    .map(([targetUid]) => targetUid)
    .sort();

  if (tiedTargets.length === 1) return tiedTargets[0];

  const godfatherTarget = godfatherUid ? votes[godfatherUid] : undefined;
  if (godfatherTarget && tiedTargets.includes(godfatherTarget)) return godfatherTarget;
  // No Godfather to decide: draw among the tied targets. Seeded so every
  // recompute of the same night lands on the same target.
  return tieBreakSeed === undefined
    ? null
    : tiedTargets[hashString(tieBreakSeed) % tiedTargets.length];
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}
