import { getRoleById } from "@/data/roles";
import type {
  GamePublicRecord,
  GraveyardDeathCause,
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
export type GraveyardDeathContext = Pick<GraveyardEntryRecord, "diedPhase" | "diedNumber" | "cause" | "killerRoleId">;

export function buildGraveyardEntry(
  roleId: string | undefined,
  cleaned: boolean,
  diedAt: number,
  context: GraveyardDeathContext = {},
): GraveyardEntryRecord {
  const entry: GraveyardEntryRecord = cleaned || !roleId
    ? { cleaned: true, diedAt }
    : { roleId, cleaned: false, diedAt };
  // Sem undefined: o Realtime Database recusa campos indefinidos.
  if (context.diedPhase) entry.diedPhase = context.diedPhase;
  if (context.diedNumber !== undefined) entry.diedNumber = context.diedNumber;
  if (context.cause) entry.cause = context.cause;
  if (context.killerRoleId) entry.killerRoleId = context.killerRoleId;
  return entry;
}

/** A fase em que a partida está agora, para mortes aplicadas fora de uma resolução. */
export function getGraveyardDeathContext(
  game: Pick<GamePublicRecord, "phase" | "day" | "nightNumber">,
  cause: GraveyardDeathCause,
): GraveyardDeathContext {
  return game.phase === "night"
    ? { diedPhase: "night", diedNumber: game.nightNumber ?? 1, cause }
    : { diedPhase: "day", diedNumber: game.day ?? 0, cause };
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

const DEATH_CAUSE_LABELS: Record<GraveyardDeathCause, string> = {
  night: "Morto durante a noite",
  "night-attack": "Morto durante a noite",
  "mafia-attack": "Morto pela Máfia",
  "veteran-attack": "Morto pelo Veteran",
  "bodyguard-counterattack": "Morto pelo Bodyguard",
  "bodyguard-sacrifice": "Morto durante a noite",
  "witch-curse": "Morto pela Witch",
  hanging: "Enforcado pela cidade",
  "day-death": "Morreu durante o dia",
  "jester-revenge": "Morto pelo Jester",
  host: "Morto pelo mestre",
};

function describeCause(grave: GraveyardEntryRecord): string | null {
  const killer = grave.killerRoleId ? getRoleById(grave.killerRoleId) : undefined;
  if (killer) return killer.faction === "mafia" ? "Morto pela Máfia" : `Morto pelo ${killer.name}`;
  return grave.cause ? DEATH_CAUSE_LABELS[grave.cause] ?? null : null;
}

/** Causa e momento da morte, ex.: "Enforcado pela cidade" e "Dia 2". Lápides antigas não têm. */
export function describeGraveyardDeath(
  grave: GraveyardEntryRecord,
): { cause: string | null; when: string | null } | null {
  if (!grave.cause && !grave.diedPhase) return null;
  return {
    cause: describeCause(grave),
    when: grave.diedPhase && grave.diedNumber !== undefined
      ? `${grave.diedPhase === "night" ? "Noite" : "Dia"} ${grave.diedNumber}`
      : null,
  };
}
