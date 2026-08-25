export const FACTIONS = ["town", "mafia", "neutral"] as const;
export const ATTACK_LEVELS = [
  "none",
  "basic",
  "powerful",
  "unstoppable",
] as const;
export const DEFENSE_LEVELS = [
  "none",
  "basic",
  "powerful",
  "invincible",
] as const;
export const ROLE_VERIFICATION_STATUSES = [
  "verified",
  "needs-verification",
] as const;
export const NEEDS_VERIFICATION = "needs-verification" as const;

export type Faction = (typeof FACTIONS)[number];
export type AttackLevel = (typeof ATTACK_LEVELS)[number];
export type DefenseLevel = (typeof DEFENSE_LEVELS)[number];
export type RoleVerificationStatus =
  (typeof ROLE_VERIFICATION_STATUSES)[number];
export type RoleAttackLevel = AttackLevel | typeof NEEDS_VERIFICATION;
export type RoleDefenseLevel = DefenseLevel | typeof NEEDS_VERIFICATION;

export const ENGINE_EFFECT_TYPES = [
  "protect",
  "investigate",
  "attack",
  "roleblock",
  "clean",
  "redirect",
  "status-effect",
] as const;

export type EngineEffectType = (typeof ENGINE_EFFECT_TYPES)[number];
export type AllowedTargetType = "player";

export interface RoleActionDefinition {
  id: string;
  label: string;
  verb: string;
  type: string;
  requiresTarget: boolean;
  targetCount: number;
  allowedTargetType: AllowedTargetType;
  allowSelfTarget: boolean;
  allowDeadTarget: boolean;
  requireDeadTarget?: boolean;
  allowDuplicateTargets?: boolean;
  targetRelation?: "adjacent-pair";
  sharedFactionAction?: boolean;
  /** First night in which the action may be recorded. */
  availableFromNight?: number;
  /** Restricts the action to one specific night. */
  availableOnNight?: number;
  /** Restricts the action to even-numbered nights. */
  evenNightsOnly?: boolean;
  /** Maximum confirmed uses by the same player during a game. */
  maxUses?: number;
  priority?: number;
  engineEffectType?: EngineEffectType;
  engineEffectConfig?: {
    attackLevel?: AttackLevel;
    protectionLevel?: DefenseLevel;
    investigationType?: string;
    statusType?: string;
    blockedByTargetStatuses?: readonly string[];
  };
  verificationStatus: RoleVerificationStatus;
}

export interface RoleDefinition {
  id: string;
  name: string;
  faction: Faction;
  alignment: string;
  description: string;
  beginnerDescription?: string;
  goal: string;
  /** Virtue Value printed on the physical card. */
  virtueValue: number;
  /** Number of copies included in the physical card game. */
  cardCount: number;
  importantInteractions: readonly string[];
  attack: RoleAttackLevel;
  defense: RoleDefenseLevel;
  wakesAtNight?: boolean;
  wakeOrder?: number;
  wakeGroupId?: string;
  wakeGroupLabel?: string;
  actionDefinitions?: readonly RoleActionDefinition[];
  /** Legacy alias retained for isolated automated-mode code. */
  action?: RoleActionDefinition;
  investigativeAppearance?: Record<string, string>;
  priority?: number;
  verificationStatus: RoleVerificationStatus;
  verificationNotes?: readonly string[];
}
