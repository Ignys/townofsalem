import type { EnginePlayer } from "./types";
import { getInvestigationResult } from "./investigation";
import { withDefaultVariants, type GameVariants } from "./variants";

export function calculateInvestigationInteraction(
  target: EnginePlayer,
  investigationType: string,
  options: { nightNumber?: number; variants?: Partial<GameVariants> } = {},
) {
  const result = getInvestigationResult(
    target,
    investigationType,
    options.nightNumber ?? 1,
    withDefaultVariants(options.variants),
  );
  return result ? { supported: true as const, result, reasonCode: "INVESTIGATION_MAPPING_FOUND" } : { supported: false as const, result: null, reasonCode: "RULE_NOT_MODELED" };
}
