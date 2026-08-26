export const FACTIONS = ["town", "mafia", "neutral"] as const;
export const ROLE_VERIFICATION_STATUSES = [
  "verified",
  "needs-verification",
] as const;
export const NEEDS_VERIFICATION = "needs-verification" as const;

export type Faction = (typeof FACTIONS)[number];
export type RoleVerificationStatus =
  (typeof ROLE_VERIFICATION_STATUSES)[number];

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
  /** Whether this role can be killed by an unprevented night kill. */
  canDieAtNight: boolean;
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
