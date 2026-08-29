import { ROLE_DEFINITIONS } from "@/data/roles";
import type { GraveyardEntryRecord } from "@/lib/firebase/schema";
import type { RoleDefinition } from "@/types";

export interface RemainingRoleEntry {
  role: RoleDefinition;
  count: number;
}

export interface RevealedDeadRole {
  uid: string;
  roleId: string | null;
  diedAt: number;
}

/**
 * Roles from the composition that are still unaccounted for.
 *
 * Only *revealed* corpses subtract from the list: a body cleaned by the Janitor
 * reveals nothing, so its role stays here — which is exactly the uncertainty the
 * Janitor is supposed to buy the Mafia.
 */
export function getRemainingRoleEntries(
  composition: Readonly<Record<string, number>> | null | undefined,
  graveyard: Readonly<Record<string, GraveyardEntryRecord>> | null | undefined,
): RemainingRoleEntry[] {
  const remaining = new Map<string, number>(Object.entries(composition ?? {}));

  for (const entry of Object.values(graveyard ?? {})) {
    if (entry.cleaned || !entry.roleId) continue;
    const left = remaining.get(entry.roleId);
    // A role change (Amnesiac, Executioner turned Jester) can reveal a role the
    // composition never held, so never let a count go negative.
    if (left === undefined || left <= 0) continue;
    remaining.set(entry.roleId, left - 1);
  }

  return ROLE_DEFINITIONS.flatMap((role) => {
    const count = remaining.get(role.id) ?? 0;
    return count > 0 ? [{ role, count }] : [];
  });
}

/** Dead players ordered by time of death, oldest grave first. */
export function getGraveyardEntriesInDeathOrder(
  graveyard: Readonly<Record<string, GraveyardEntryRecord>> | null | undefined,
): RevealedDeadRole[] {
  return Object.entries(graveyard ?? {})
    .map(([uid, entry]) => ({
      uid,
      roleId: entry.cleaned ? null : (entry.roleId ?? null),
      diedAt: entry.diedAt,
    }))
    .sort((left, right) => left.diedAt - right.diedAt);
}
