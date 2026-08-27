import type { EngineEffect } from "./types";

export interface EngineVisit {
  sourceActionId: string;
  visitorUid?: string;
  sourceFaction?: "town" | "mafia" | "neutral";
  participantUids: readonly string[];
  targetUid: string;
}

export function collectVisits(effects: readonly EngineEffect[]): EngineVisit[] {
  return effects.flatMap((effect) => {
    if (effect.countsAsVisit === false || effect.targetUids.length === 0) {
      return [];
    }

    const factionVisit = effect.sourceType === "faction";
    return effect.targetUids.map((targetUid) => ({
      sourceActionId: effect.id,
      ...(factionVisit ? {} : { visitorUid: effect.actorUid }),
      ...(effect.sourceFaction ? { sourceFaction: effect.sourceFaction } : {}),
      participantUids: effect.participantUids ?? [effect.actorUid],
      targetUid,
    }));
  });
}
