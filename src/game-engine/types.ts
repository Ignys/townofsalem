import type { AttackLevel, DefenseLevel, EngineEffectType, Faction, RoleDefinition } from "@/types";

export interface EnginePlayer {
  uid: string;
  name: string;
  alive: boolean;
  roleId: string;
  faction: Faction;
  defense: DefenseLevel;
  statuses: readonly string[];
  investigativeAppearance?: Readonly<Record<string, string>>;
}

export interface EngineGameState {
  gameId: string;
  nightId: string;
  players: readonly EnginePlayer[];
}

export interface EngineNightAction {
  id: string;
  actorUid: string;
  roleId: string;
  actionId: string;
  targetUids: readonly string[];
  effectType?: EngineEffectType;
  priority?: number;
  attackLevel?: AttackLevel;
  protectionLevel?: DefenseLevel;
  investigationType?: string;
  statusType?: string;
  blockedByTargetStatuses?: readonly string[];
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
  details?: Readonly<Record<string, string | number | boolean | null>>;
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

export interface NightResolution {
  nightId: string;
  deaths: readonly string[];
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
  partial: boolean;
}

export interface AttackDefenseRule {
  attackLevel: AttackLevel;
  defenseLevel: DefenseLevel;
  success: boolean;
}

export interface EngineRulesContext {
  roleDefinitions: readonly RoleDefinition[];
  attackDefenseRules: readonly AttackDefenseRule[];
}
