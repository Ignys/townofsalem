import type { GamePhase } from "@/types";

/**
 * Fases em que os jogadores podem acusar.
 *
 * O modo assistido deixa o mestre pular livremente entre `day` e `discussion`, então
 * restringir a `discussion` deixaria de fora um mestre que nunca sai de `day`.
 * Esta lista precisa continuar sincronizada com a regra de `votes/$day/accusations` em
 * `database.rules.json`.
 */
export const ACCUSATION_PHASES = ["day", "discussion"] as const;

export type AccusationPhase = (typeof ACCUSATION_PHASES)[number];

export function isAccusationPhase(phase: GamePhase): phase is AccusationPhase {
  return (ACCUSATION_PHASES as readonly string[]).includes(phase);
}

/** Fases em que um acusado já foi escolhido e o julgamento está em andamento. */
export function isTrialPhase(phase: GamePhase): boolean {
  return phase === "trial" || phase === "defense" || phase === "verdict";
}
