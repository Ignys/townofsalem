import type { Faction } from "@/types";

import type { FactionCounts } from "./balanced-composition-generator";

export const MIN_SUPPORTED_PLAYER_COUNT = 4;
export const MAX_SUPPORTED_PLAYER_COUNT = 36;

const FACTION_ORDER: readonly Faction[] = ["town", "mafia", "neutral"];

export function getSuggestedFactionCounts(
  playerCount: number,
): FactionCounts | null {
  if (
    !Number.isInteger(playerCount) ||
    playerCount < MIN_SUPPORTED_PLAYER_COUNT ||
    playerCount > MAX_SUPPORTED_PLAYER_COUNT
  ) {
    return null;
  }

  const mafia = Math.max(1, Math.round(playerCount * 0.27));
  const neutral =
    playerCount >= 6 ? Math.max(1, Math.round(playerCount * 0.13)) : 0;

  return {
    town: playerCount - mafia - neutral,
    mafia,
    neutral,
  };
}

export function formatFactionCounts(counts: FactionCounts): string {
  return FACTION_ORDER.map((faction) => counts[faction]).join(":");
}
