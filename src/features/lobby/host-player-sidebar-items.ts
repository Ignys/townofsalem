import type { PublicPlayerRecord } from "@/lib/firebase/schema";

export interface HostPlayerSidebarPlayerItem {
  kind: "player";
  playerUid: string;
  player: PublicPlayerRecord;
  houseNumber: number;
}

export interface HostPlayerSidebarDeadSeparatorItem {
  kind: "dead-separator";
  deadPlayerCount: number;
}

export interface HostPlayerSidebarLivingSeparatorItem {
  kind: "living-separator";
  livingPlayerCount: number;
}

export type HostPlayerSidebarItem =
  | HostPlayerSidebarPlayerItem
  | HostPlayerSidebarLivingSeparatorItem
  | HostPlayerSidebarDeadSeparatorItem;

export function getHostPlayerSidebarItems(
  orderedPlayerUids: readonly string[],
  playerByUid: ReadonlyMap<string, PublicPlayerRecord>,
  gameStarted: boolean,
): HostPlayerSidebarItem[] {
  const playerItems = orderedPlayerUids.flatMap((playerUid, index) => {
    const player = playerByUid.get(playerUid);

    return player
      ? [{ kind: "player" as const, playerUid, player, houseNumber: index + 1 }]
      : [];
  });

  if (!gameStarted) {
    return playerItems;
  }

  const livingPlayers = playerItems.filter(({ player }) => player.alive);
  const deadPlayers = playerItems.filter(({ player }) => !player.alive);

  return [
    { kind: "living-separator", livingPlayerCount: livingPlayers.length },
    ...livingPlayers,
    ...(deadPlayers.length > 0
      ? [{ kind: "dead-separator" as const, deadPlayerCount: deadPlayers.length }]
      : []),
    ...deadPlayers,
  ];
}
