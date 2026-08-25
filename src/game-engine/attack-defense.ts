import type { AttackLevel, DefenseLevel } from "@/types";

import type { AttackDefenseRule } from "./types";

export interface AttackDefenseResult {
  success: boolean | null;
  attackLevel: AttackLevel;
  defenseLevel: DefenseLevel;
  reasonCode: "ATTACK_SUCCEEDED" | "ATTACK_BLOCKED_BY_DEFENSE" | "INTERACTION_NOT_CONFIGURED";
}

export function resolveAttackAgainstDefense(
  attackLevel: AttackLevel,
  defenseLevel: DefenseLevel,
  rules: readonly AttackDefenseRule[],
): AttackDefenseResult {
  const rule = rules.find((candidate) => candidate.attackLevel === attackLevel && candidate.defenseLevel === defenseLevel);
  if (!rule) return { success: null, attackLevel, defenseLevel, reasonCode: "INTERACTION_NOT_CONFIGURED" };
  return {
    success: rule.success,
    attackLevel,
    defenseLevel,
    reasonCode: rule.success ? "ATTACK_SUCCEEDED" : "ATTACK_BLOCKED_BY_DEFENSE",
  };
}
