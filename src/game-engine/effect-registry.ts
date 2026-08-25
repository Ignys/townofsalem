import type { EngineEffect, EngineNightAction, EngineWarning } from "./types";

export function createEffects(actions: readonly EngineNightAction[]): { effects: readonly EngineEffect[]; warnings: readonly EngineWarning[] } {
  const effects: EngineEffect[] = [];
  const warnings: EngineWarning[] = [];
  for (const action of actions) {
    if (!action.effectType || action.priority === undefined) {
      warnings.push({ code: "UNSUPPORTED_ACTION", actionId: action.id, message: "Efeito ou prioridade ainda não modelado." });
      continue;
    }
    effects.push({ ...action, effectType: action.effectType, priority: action.priority });
  }
  return { effects, warnings };
}
