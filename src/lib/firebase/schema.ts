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
  gameEndedAt?: number;
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
