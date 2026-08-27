import type {
  EngineEffectType,
  RoleActionDefinition,
  RoleVerificationStatus,
} from "@/types";

interface ActionOptions {
  id: string;
  label: string;
  verb: string;
  targetCount?: number;
  allowSelfTarget?: boolean;
  allowDeadTarget?: boolean;
  requireDeadTarget?: boolean;
  allowDuplicateTargets?: boolean;
  targetRelation?: RoleActionDefinition["targetRelation"];
  sharedFactionAction?: boolean;
  availableFromNight?: number;
  availableOnNight?: number;
  evenNightsOnly?: boolean;
  maxUses?: number;
  priority?: number;
  engineEffectType?: EngineEffectType;
  engineEffectConfig?: RoleActionDefinition["engineEffectConfig"];
  verificationStatus?: RoleVerificationStatus;
}

export function nightAction({
  targetCount = 1,
  allowSelfTarget = false,
  allowDeadTarget = false,
  verificationStatus = "verified",
  ...options
}: ActionOptions): RoleActionDefinition {
  return {
    ...options,
    type: options.engineEffectType ?? options.id,
    requiresTarget: targetCount > 0,
    targetCount,
    allowedTargetType: "player",
    allowSelfTarget,
    allowDeadTarget,
    verificationStatus,
  };
}

export const mafiaAttackOrderAction = nightAction({
  id: "mafia-kill-vote",
  label: "Ordenar ataque da Mafia",
  verb: "manda atacar",
  sharedFactionAction: true,
  availableFromNight: 2,
});

export const exactInvestigationConfig = {
  priority: 40,
  engineEffectType: "investigate",
  engineEffectConfig: { investigationType: "exact-role" },
} as const;
