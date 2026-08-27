import type { GamePublicRecord } from "@/lib/firebase/schema";
import type { GamePhase } from "@/types";

export function shouldConfirmNightEnd(currentPhase: GamePhase): boolean {
  return currentPhase === "night";
}

export function getNightEndLabel(
  game: Pick<GamePublicRecord, "nightNumber">,
): string {
  return `Noite ${game.nightNumber ?? 1}`;
}
