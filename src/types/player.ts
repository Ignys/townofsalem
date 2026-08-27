import type { Faction } from "./role";

export const PLAYER_EXPERIENCE_LEVELS = [
  "beginner",
  "experienced",
] as const;

export type PlayerExperience = (typeof PLAYER_EXPERIENCE_LEVELS)[number];

export interface PlayerStatus {
  type: string;
}

export interface Player {
  id: string;
  uid: string;
  name: string;
  isBot?: boolean;
  seat?: number;
  alive: boolean;
  disconnected: boolean;
  experience: PlayerExperience;
  statuses?: readonly PlayerStatus[];
  /** Host-only snapshot of the card drawn before any role transformation. */
  originalRoleId?: string;
}

export interface PrivatePlayerState {
  playerId: string;
  roleId: string;
  faction: Faction;
  statuses: readonly PlayerStatus[];
  resourceUses?: Readonly<Record<string, number>>;
  originalRoleId?: string;
}
