import type { NightResolution } from "@/game-engine/types";
import type { PlayerStatus } from "./player";

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
  appliedAt?: number;
  rolledBackAt?: number;
}
