import type { PublicPlayerRecord } from "@/lib/firebase/schema";

export type PublicPlayerEntry = [string, PublicPlayerRecord];

function comparePlayers(
  [, first]: PublicPlayerEntry,
  [, second]: PublicPlayerEntry,
) {
  if (first.seat && second.seat) {
    return first.seat - second.seat;
  }

  if (first.seat) {
    return -1;
  }

  if (second.seat) {
    return 1;
  }

  return first.name.localeCompare(second.name, "pt-BR");
}

export function getPlayerEntries(
  players: Record<string, PublicPlayerRecord>,
): PublicPlayerEntry[] {
  return Object.entries(players).sort(comparePlayers);
}

export function getConnectedPlayerEntries(
  players: Record<string, PublicPlayerRecord>,
): PublicPlayerEntry[] {
  return getPlayerEntries(players).filter(
    ([, player]) => !player.disconnected,
  );
}
