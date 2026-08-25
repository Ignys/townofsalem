import type { EngineEffect } from "./types";

export function sortEffectsByPriority(effects: readonly EngineEffect[]): readonly EngineEffect[] {
  return [...effects].sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}
