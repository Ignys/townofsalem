import type {
  GraveyardEntryRecord,
  PrivatePlayerRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";

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

/**
 * Tombstones missing for players who are already dead.
 *
 * Deaths recorded before the graveyard existed — or while its security rules
 * were not deployed yet — left no tombstone, which would keep those bodies
 * anonymous on every player screen for the rest of the match.
 */
export function getMissingGraveyardEntries(
  players: Readonly<Record<string, PublicPlayerRecord>> | null,
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>> | null,
  graveyard: Readonly<Record<string, GraveyardEntryRecord>> | null,
  diedAt: number,
): Record<string, GraveyardEntryRecord> {
  return Object.fromEntries(
    Object.entries(players ?? {})
      .filter(([uid, player]) => !player.alive && !graveyard?.[uid])
      .map(([uid]) => [
        uid,
        buildGraveyardEntry(
          privatePlayers?.[uid]?.roleId,
          Boolean(privatePlayers?.[uid]?.statuses?.cleaned),
          diedAt,
        ),
      ]),
  );
}
