/** Host-chosen roles keyed by player uid; everyone else is drawn at random. */
export type ForcedRolesRecord = Record<string, string>;

export interface ForcedRolesSplit {
  forced: Record<string, string>;
  remainingUids: string[];
  remainingRoleIds: string[];
}

/**
 * Takes each pinned player's role out of the resolved deck. A pin only counts
 * against a fixed role in the composition (not a random slot), so `invalid`
 * names the first role pinned more times than the composition holds it.
 */
export function splitForcedRoles(
  participantUids: readonly string[],
  compositionRoleIds: readonly string[],
  resolvedRoleIds: readonly string[],
  forcedRoles: ForcedRolesRecord | null | undefined,
): ForcedRolesSplit | { invalid: string } {
  const available = [...compositionRoleIds];
  const deck = [...resolvedRoleIds];
  const forced: Record<string, string> = {};

  for (const uid of participantUids) {
    const roleId = forcedRoles?.[uid];
    if (!roleId) continue;
    const slot = available.indexOf(roleId);
    if (slot === -1) return { invalid: roleId };
    available.splice(slot, 1);
    deck.splice(deck.indexOf(roleId), 1);
    forced[uid] = roleId;
  }

  return {
    forced,
    remainingUids: participantUids.filter((uid) => !(uid in forced)),
    remainingRoleIds: deck,
  };
}
