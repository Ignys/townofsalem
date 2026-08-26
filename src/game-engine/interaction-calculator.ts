import type { EnginePlayer } from "./types";

export function calculateInvestigationInteraction(target: EnginePlayer, investigationType: string) {
  const result = target.investigativeAppearance?.[investigationType];
  return result ? { supported: true as const, result, reasonCode: "INVESTIGATION_MAPPING_FOUND" } : { supported: false as const, result: null, reasonCode: "RULE_NOT_MODELED" };
}
