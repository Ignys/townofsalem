import { resolveAttackAgainstDefense } from "./attack-defense";
import type { AttackDefenseRule, EnginePlayer } from "./types";

export function calculateAttackInteraction(attackLevel: Parameters<typeof resolveAttackAgainstDefense>[0], defenseLevel: Parameters<typeof resolveAttackAgainstDefense>[1], rules: readonly AttackDefenseRule[]) {
  return resolveAttackAgainstDefense(attackLevel, defenseLevel, rules);
}

export function calculateInvestigationInteraction(target: EnginePlayer, investigationType: string) {
  const result = target.investigativeAppearance?.[investigationType];
  return result ? { supported: true as const, result, reasonCode: "INVESTIGATION_MAPPING_FOUND" } : { supported: false as const, result: null, reasonCode: "RULE_NOT_MODELED" };
}
