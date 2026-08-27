import type { EngineRandomDecision } from "./types";

export interface RandomSource {
  pickIndex(key: string, candidateCount: number): number;
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function createSeededRandomSource(seed: string): RandomSource {
  return {
    pickIndex(key, candidateCount) {
      if (candidateCount <= 0) throw new Error("random-choice-without-candidates");
      return hash(`${seed}:${key}`) % candidateCount;
    },
  };
}

export function createRandomRecorder(
  source: RandomSource,
  decisions: EngineRandomDecision[],
) {
  return function choose(key: string, candidates: readonly string[]): string {
    const sorted = [...new Set(candidates)].sort();
    if (sorted.length === 0) throw new Error("random-choice-without-candidates");
    const selectedUid = sorted[source.pickIndex(key, sorted.length)];
    decisions.push({ key, candidateUids: sorted, selectedUid });
    return selectedUid;
  };
}
