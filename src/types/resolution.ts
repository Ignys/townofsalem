import type { NightResolution } from "@/game-engine/types";
import type { PlayerStatus } from "./player";
import type { Faction } from "./role";

export interface NightResolutionRecord {
  id: string;
  nightId: string;
  actionsRevision: number;
  createdAt: number;
  resolution: NightResolution;
  playerAliveBefore: Readonly<Record<string, boolean>>;
  cleanStatusBefore: Readonly<Record<string, PlayerStatus | null>>;
  appliedStatusBefore?: Readonly<
    Record<string, Readonly<Record<string, PlayerStatus | null>>>
  >;
  roleStateBefore?: Readonly<Record<string, { roleId: string; faction: Faction }>>;
  resourceUsesBefore?: Readonly<Record<string, Readonly<Record<string, number>>>>;
  appliedAt?: number;
  rolledBackAt?: number;
}
