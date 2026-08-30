import type { EngineEffectType, Faction } from "@/types";
import type { GameVariants } from "./variants";

export interface EnginePlayer {
  uid: string;
  name: string;
  alive: boolean;
  roleId: string;
  faction: Faction;
  canDieAtNight: boolean;
  statuses: readonly string[];
  seat?: number;
  originalRoleId?: string;
  investigativeAppearance?: Readonly<Record<string, string>>;
}

export interface EngineGameState {
  gameId: string;
  nightId: string;
  nightNumber?: number;
  players: readonly EnginePlayer[];
  variants?: Partial<GameVariants>;
  amnesiacRolePool?: readonly string[];
  resourceUses?: Readonly<Record<string, number>>;
}

export interface EngineNightAction {
  id: string;
  actorUid: string;
  roleId: string;
  actionId: string;
  targetUids: readonly string[];
  effectType?: EngineEffectType;
  priority?: number;
  investigationType?: string;
  statusType?: string;
  blockedByTargetStatuses?: readonly string[];
  protectionType?: "doctor" | "bodyguard";
  attacksVisitors?: "first" | "all";
  sourceType?: "player" | "faction";
  sourceFaction?: Faction;
  participantUids?: readonly string[];
  countsAsVisit?: boolean;
}

export interface EngineEffect extends EngineNightAction {
  effectType: EngineEffectType;
  priority: number;
}

export interface EngineWarning {
  code: string;
  actionId?: string;
  message: string;
}

export interface EngineEvent {
  type: string;
  actorUid?: string;
  targetUid?: string;
  actionId?: string;
  reasonCode: string;
  details?: Readonly<Record<string, string | number | boolean | null | readonly string[]>>;
}

export interface InvestigationResult {
  actorUid: string;
  targetUid: string;
  investigationType: string;
  result: string;
  sourceActionId: string;
}

export interface EngineSurvival {
  targetUid: string;
  reasonCode: string;
  sourceActionIds: readonly string[];
}

export type NightDeathCause =
  | "night-attack"
  | "mafia-attack"
  | "veteran-attack"
  | "bodyguard-counterattack"
  | "bodyguard-sacrifice"
  | "visitor-attack"
  | "witch-curse";

export interface EngineDeath {
  targetUid: string;
  cause: NightDeathCause;
  sourceActionId?: string;
  attackerUid?: string;
  originalTargetUid?: string;
  originalAttackCause?: NightDeathCause;
  unavoidable?: boolean;
}

export interface EngineRandomDecision {
  key: string;
  candidateUids: readonly string[];
  selectedUid: string;
}

export interface EngineRoleChange {
  playerUid: string;
  fromRoleId: string;
  toRoleId: string;
  reasonCode: string;
}

export interface EngineMediumClue {
  mediumUid: string;
  victimUid: string;
  responsiblePlayerUid: string;
  candidateUids: readonly string[];
  candidateCount: 2 | 3 | 4;
}

export interface NightResolution {
  nightId: string;
  deaths: readonly string[];
  deathRecords?: readonly EngineDeath[];
  survivors: readonly EngineSurvival[];
  investigationResults: readonly InvestigationResult[];
  appliedEffects: readonly EngineEffect[];
  blockedActions: readonly string[];
  failedActions: readonly string[];
  warnings: readonly EngineWarning[];
  engineEvents: readonly EngineEvent[];
  cleanedPlayerUids: readonly string[];
  appliedStatuses?: readonly {
    targetUid: string;
    statusType: string;
    sourceActionId: string;
  }[];
  removedStatuses?: readonly {
    targetUid: string;
    statusType: string;
  }[];
  randomDecisions?: readonly EngineRandomDecision[];
  roleChanges?: readonly EngineRoleChange[];
  consumedResources?: readonly {
    playerUid: string;
    resource: string;
    amount: number;
  }[];
  individualWinnerUids?: readonly string[];
  mediumClues?: readonly EngineMediumClue[];
  partial: boolean;
}
