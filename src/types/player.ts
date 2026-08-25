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
  seat?: number;
  alive: boolean;
  disconnected: boolean;
  experience: PlayerExperience;
  statuses?: readonly PlayerStatus[];
}

export interface PrivatePlayerState {
  playerId: string;
  roleId: string;
  faction: Faction;
  statuses: readonly PlayerStatus[];
}
