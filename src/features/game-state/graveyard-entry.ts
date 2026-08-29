import type { GraveyardEntryRecord } from "@/lib/firebase/schema";

/**
 * Builds the public tombstone written when a player dies.
 *
 * A corpse cleaned by the Janitor keeps its role secret: the entry omits the
 * role entirely, so the role stays counted among the ones still unaccounted
 * for on every player's screen.
 */
export function buildGraveyardEntry(
  roleId: string | undefined,
  cleaned: boolean,
  diedAt: number,
): GraveyardEntryRecord {
  return cleaned || !roleId
    ? { cleaned: true, diedAt }
    : { roleId, cleaned: false, diedAt };
}
