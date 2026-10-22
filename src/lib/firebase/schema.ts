import type {
  GameEvent,
  GamePhase,
  GameStatus,
  Player,
  PlayerStatus,
  PrivatePlayerState,
  NightSession,
  PhaseSession,
  HostNightActionEntry,
  HostNightNote,
  NightResolutionRecord,
} from "@/types";
import type { GameVariants } from "@/game-engine/variants";

export type FirebaseJsonValue =
  | string
  | number
  | boolean
  | null
  | FirebaseJsonValue[]
  | { [key: string]: FirebaseJsonValue };

export interface GamePublicRecord {
  code: string;
  status: GameStatus;
  phase: GamePhase;
  day: number;
  phaseEndsAt: number | null;
  timerPaused?: boolean;
  timerRemainingMs?: number | null;
  accusedPlayerUid?: string | null;
  verdictClosedAt?: number | null;
  verdictOutcome?: VerdictOutcome | null;
  phaseLabel?: string;
  phaseSessionId?: string | null;
  currentNightId?: string | null;
  phaseSequenceNumber?: number;
  nightNumber?: number;
  winningFactions?: readonly string[];
  winningPlayerUids?: readonly string[];
  /** Role de cada jogador, publicada só quando a partida termina. */
  finalRoles?: Record<string, string>;
  gameEndedAt?: number;
  /** "hostless": o computador vira só a mesa e o motor resolve tudo; "host-player": igual, mas a mesa é o celular de quem criou a sala, que também joga. Ausente equivale a "hosted". */
  playMode?: GamePlayMode;
  /** Ritmo do modo sem mestre. Ausente equivale a "relaxed". */
  gamePace?: GamePace;
}

export const GAME_PACES = ["relaxed", "normal", "fast"] as const;
export type GamePace = (typeof GAME_PACES)[number];

export const GAME_PLAY_MODES = ["hosted", "hostless", "host-player"] as const;
export type GamePlayMode = (typeof GAME_PLAY_MODES)[number];

export function isHostlessGame(game: Pick<GamePublicRecord, "playMode">): boolean {
  return game.playMode === "hostless" || game.playMode === "host-player";
}

export interface GameSettingsRecord {
  maxPlayers?: number;
  preset?: string | null;
  roleComposition?: Record<string, number>;
  rolesAssignedAt?: number;
  phaseDurations?: Partial<Record<GamePhase, number>>;
  revealRolesAtGameOver?: boolean;
  gameVariants?: GameVariants;
  amnesiacRolePool?: readonly string[];
  /** Roles que nunca saem de um slot aleatório, separadas por vírgula. Ver parseRandomRoleExclusions. */
  randomRoleExclusions?: string;
}

export interface RoomCodeReservation {
  gameId: string;
  reservedByUid: string;
}

export type RoomCodeRecord = string | RoomCodeReservation;

export type PublicPlayerRecord = Pick<
  Player,
  "name" | "isBot" | "alive" | "disconnected" | "experience" | "seat"
>;

export type PrivatePlayerRecord = Pick<
  PrivatePlayerState,
  "roleId" | "faction"
> & {
  statuses?: Record<string, PlayerStatus>;
  resourceUses?: Record<string, number>;
  originalRoleId?: string;
};

/**
 * Public tombstone for a dead player.
 *
 * The role is only written when the corpse was *not* cleaned by the Janitor —
 * a cleaned body must stay anonymous, so `roleId` is simply absent and the
 * role remains in the "still out there" list every player can see.
 */
export type GraveyardDeathCause =
  | "night"
  | "night-attack"
  | "mafia-attack"
  | "veteran-attack"
  | "bodyguard-counterattack"
  | "bodyguard-sacrifice"
  | "witch-curse"
  | "hanging"
  | "day-death"
  | "jester-revenge"
  | "host";

export type GraveyardEntryRecord = {
  roleId?: string;
  cleaned: boolean;
  diedAt: number;
  /** Quando morreu, em termos de jogo: "Noite 2", "Dia 3". Ausente em lápides antigas. */
  diedPhase?: "night" | "day";
  diedNumber?: number;
  cause?: GraveyardDeathCause;
  /** Role de quem matou, quando o ataque não é da Máfia (ex.: Serial Killer). Nunca o nome. */
  killerRoleId?: string;
};

export interface NightActionRecord {
  actionType: string;
  targetUid?: string;
  createdAt: number;
}

export const VERDICT_VOTES = ["guilty", "innocent", "abstain"] as const;

export type VerdictVote = (typeof VERDICT_VOTES)[number];

export const VERDICT_OUTCOMES = ["guilty", "innocent", "tie"] as const;

export type VerdictOutcome = (typeof VERDICT_OUTCOMES)[number];

export interface DayVotesRecord {
  accusations?: Record<string, string>;
  verdicts?: Record<string, VerdictVote>;
}

export type StoredGameEvent = Omit<
  GameEvent<FirebaseJsonValue>,
  "id" | "gameId"
>;

export interface GameRecord {
  hostUid: string;
  public: GamePublicRecord;
  settings?: GameSettingsRecord;
  players?: Record<string, PublicPlayerRecord>;
  privatePlayers?: Record<string, PrivatePlayerRecord>;
  graveyard?: Record<string, GraveyardEntryRecord>;
  phaseSessions?: Record<string, PhaseSession>;
  nightSessions?: Record<string, NightSession>;
  hostNightActions?: Record<string, Record<string, HostNightActionEntry>>;
  hostNotes?: Record<string, Record<string, HostNightNote>>;
  nightResolutions?: Record<string, NightResolutionRecord>;
  nightResolutionVersions?: Record<string, Record<string, NightResolutionRecord>>;
  actions?: Record<string, Record<string, NightActionRecord>>;
  votes?: Record<string, DayVotesRecord>;
  events?: Record<string, StoredGameEvent>;
}

export interface RealtimeDatabaseSchema {
  roomCodes: Record<string, RoomCodeRecord>;
  games: Record<string, GameRecord>;
}
