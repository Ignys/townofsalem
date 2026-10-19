import { ROLE_DEFINITIONS } from "@/data/roles";
import type { RandomSource } from "@/game-engine/draw-roles";
import type { Faction, RoleDefinition } from "@/types";

export interface RandomRoleSlot {
  id: string;
  name: string;
  /** null: any faction. */
  faction: Faction | null;
}

/**
 * Composition entries that only become a real role when the game starts. The
 * public composition keeps the slot, so nobody — host included — learns what
 * it rolled until a revealed death shows it.
 */
export const RANDOM_ROLE_SLOTS: readonly RandomRoleSlot[] = [
  { id: "random-town", name: "Cidade aleatório", faction: "town" },
  { id: "random-mafia", name: "Máfia aleatório", faction: "mafia" },
  { id: "random-neutral", name: "Neutro aleatório", faction: "neutral" },
  { id: "random-any", name: "Aleatório", faction: null },
];

/** Too strong to show up out of nowhere; the host may edit this per game. */
export const DEFAULT_RANDOM_ROLE_EXCLUSIONS: readonly string[] = ["godfather", "mayor"];

/** Rerolls before giving up on a composition with at least one Mafia. */
const MAX_ATTEMPTS = 50;

/**
 * Stored as one comma-separated string: Firebase drops empty arrays, and an
 * empty string is how the host says "exclude nothing". Absent = defaults.
 */
export function parseRandomRoleExclusions(stored: string | undefined): readonly string[] {
  return stored === undefined ? DEFAULT_RANDOM_ROLE_EXCLUSIONS : stored.split(",").filter(Boolean);
}

export function getRandomRoleSlot(id: string): RandomRoleSlot | undefined {
  return RANDOM_ROLE_SLOTS.find((slot) => slot.id === id);
}

export class RandomRoleResolutionError extends Error {
  constructor(readonly slotId: string) {
    super(`No role left to fill ${slotId}.`);
    this.name = "RandomRoleResolutionError";
  }
}

export interface ResolveRandomRolesOptions {
  excludedRoleIds: readonly string[];
  respectCardCount: boolean;
  random?: RandomSource;
}

function countRoleIds(roleIds: readonly string[]): Map<string, number> {
  const used = new Map<string, number>();
  for (const roleId of roleIds) used.set(roleId, (used.get(roleId) ?? 0) + 1);
  return used;
}

function slotPool(
  slot: RandomRoleSlot,
  used: ReadonlyMap<string, number>,
  { excludedRoleIds, respectCardCount }: ResolveRandomRolesOptions,
): RoleDefinition[] {
  return ROLE_DEFINITIONS.filter((role) =>
    (slot.faction === null || role.faction === slot.faction) &&
    !excludedRoleIds.includes(role.id) &&
    (!respectCardCount || (used.get(role.id) ?? 0) < role.cardCount)
  );
}

/** Average virtue of what a slot can roll, given the fixed roles; null if it can roll nothing. */
export function averageSlotVirtue(
  slotId: string,
  roleIds: readonly string[],
  options: ResolveRandomRolesOptions,
): number | null {
  const slot = getRandomRoleSlot(slotId);
  if (!slot) return null;
  const values = slotPool(slot, countRoleIds(roleIds.filter((roleId) => !getRandomRoleSlot(roleId))), options)
    .map((role) => role.virtueValue);
  return values.length === 0 ? null : values.reduce((total, value) => total + value, 0) / values.length;
}

export interface RandomVirtueEstimate {
  /** Fixed roles plus each slot's average. */
  expected: number;
  min: number;
  max: number;
}

/**
 * What the host may know before Play: each slot's pool, never its roll. With the
 * card cap on, pools are taken after fixed roles only; slots draining each
 * other's copies is ignored, so the range can be a little wider than reality.
 */
export function estimateVirtue(
  roleIds: readonly string[],
  options: ResolveRandomRolesOptions,
): RandomVirtueEstimate {
  const fixed = roleIds.filter((roleId) => !getRandomRoleSlot(roleId));
  const used = countRoleIds(fixed);
  const base = fixed.reduce(
    (total, roleId) => total + (ROLE_DEFINITIONS.find((role) => role.id === roleId)?.virtueValue ?? 0),
    0,
  );
  const estimate = { expected: base, min: base, max: base };

  for (const roleId of roleIds) {
    const slot = getRandomRoleSlot(roleId);
    if (!slot) continue;
    const values = slotPool(slot, used, options).map((role) => role.virtueValue);
    if (values.length === 0) continue;
    estimate.expected += values.reduce((total, value) => total + value, 0) / values.length;
    estimate.min += Math.min(...values);
    estimate.max += Math.max(...values);
  }

  return estimate;
}

function resolveOnce(
  roleIds: readonly string[],
  options: ResolveRandomRolesOptions,
): string[] {
  const random = options.random ?? Math.random;
  const used = countRoleIds(roleIds);

  // Fixed roles first, so the card cap reserves their copies before any slot rolls.
  return roleIds.map((roleId) => {
    const slot = getRandomRoleSlot(roleId);
    if (!slot) return roleId;

    // Uniform over role types, not cards: 8 Townie cards must not make Townie 8x likelier.
    const pool = slotPool(slot, used, options);
    if (pool.length === 0) throw new RandomRoleResolutionError(slot.id);

    const picked = pool[Math.floor(random() * pool.length)].id;
    used.set(picked, (used.get(picked) ?? 0) + 1);
    return picked;
  });
}

const hasMafia = (roleIds: readonly string[]) =>
  roleIds.some((roleId) => ROLE_DEFINITIONS.find((role) => role.id === roleId)?.faction === "mafia");

/**
 * Turns every random slot into a concrete role. A fully random table could roll
 * zero Mafia and end on night one, so that outcome is rerolled.
 */
export function resolveRandomRoles(
  roleIds: readonly string[],
  options: ResolveRandomRolesOptions,
): string[] {
  let resolved = resolveOnce(roleIds, options);
  for (let attempt = 1; attempt < MAX_ATTEMPTS && !hasMafia(resolved); attempt += 1) {
    resolved = resolveOnce(roleIds, options);
  }
  return resolved;
}
