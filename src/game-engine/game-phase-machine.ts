import type { GamePhase } from "@/types";

const GAME_PHASE_TRANSITIONS = Object.freeze({
  lobby: Object.freeze(["day", "night", "game-over"]),
  day: Object.freeze(["discussion", "game-over"]),
  discussion: Object.freeze(["trial", "night", "game-over"]),
  trial: Object.freeze(["defense", "game-over"]),
  defense: Object.freeze(["verdict", "game-over"]),
  verdict: Object.freeze(["discussion", "day", "night", "game-over"]),
  night: Object.freeze(["day", "game-over"]),
  custom: Object.freeze(["day", "discussion", "trial", "defense", "verdict", "night", "game-over"]),
  "game-over": Object.freeze([]),
} as const satisfies Record<GamePhase, readonly GamePhase[]>);

const NO_TRANSITIONS: readonly GamePhase[] = Object.freeze([]);

export function getAllowedTransitions(
  phase: GamePhase,
): readonly GamePhase[] {
  return GAME_PHASE_TRANSITIONS[phase] ?? NO_TRANSITIONS;
}

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  const allowedTransitions = getAllowedTransitions(from);

  return allowedTransitions.some((phase) => phase === to);
}
