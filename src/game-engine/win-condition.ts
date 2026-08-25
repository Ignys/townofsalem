import type { EngineGameState } from "./types";

export interface WinConditionResult {
  gameOver: boolean;
  winningFactions: readonly string[];
  winningPlayerUids: readonly string[];
  reasonCode: string;
  confidenceOrWarnings: readonly string[];
}

export interface WinConditionRule {
  id: string;
  evaluate: (state: EngineGameState) => Omit<WinConditionResult, "confidenceOrWarnings"> | null;
}

export function checkWinCondition(
  gameState: EngineGameState,
  confirmedRules: readonly WinConditionRule[] = [],
): WinConditionResult {
  for (const rule of confirmedRules) {
    const result = rule.evaluate(gameState);
    if (result) return { ...result, confidenceOrWarnings: [] };
  }
  return {
    gameOver: false,
    winningFactions: [],
    winningPlayerUids: [],
    reasonCode: "NO_CONFIRMED_WIN_CONDITION",
    confidenceOrWarnings: ["As condições específicas desta composição ainda não foram confirmadas."],
  };
}
