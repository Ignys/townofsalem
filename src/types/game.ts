export const GAME_PHASES = [
  "lobby",
  "day",
  "discussion",
  "trial",
  "defense",
  "verdict",
  "night",
  "custom",
  "game-over",
] as const;

export const GAME_STATUSES = ["lobby", "in-progress", "finished"] as const;

export type GamePhase = (typeof GAME_PHASES)[number];
export type GameStatus = (typeof GAME_STATUSES)[number];

export const PLAYABLE_PHASES = [
  "day",
  "discussion",
  "trial",
  "defense",
  "verdict",
  "night",
] as const satisfies readonly GamePhase[];

export type PlayablePhase = (typeof PLAYABLE_PHASES)[number];

export interface PhaseDefinition {
  id: PlayablePhase;
  label: string;
  hasTimer: boolean;
  /** Application configuration, not an assertion about official game rules. */
  defaultDurationSeconds: number | null;
}

export const PLAYER_CAPABILITIES = [
  "readOwnRole",
  "readTimer",
  "readCurrentPhaseLabel",
] as const;

export const HOST_CAPABILITIES = [
  "readAllRoles",
  "controlPhase",
  "controlTimer",
  "managePlayers",
  "recordNightActions",
  "resolveNight",
  "confirmResolution",
  "correctAdministrativeState",
] as const;

export type PlayerCapability = (typeof PLAYER_CAPABILITIES)[number];
export type HostCapability = (typeof HOST_CAPABILITIES)[number];
