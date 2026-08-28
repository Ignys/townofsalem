import type {
  PrivatePlayerRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";

export interface DeputyPromotion {
  playerUid: string;
  candidateUids: readonly string[];
}

type RandomValueSource = () => number;

function isOriginalSheriff(privatePlayer: PrivatePlayerRecord): boolean {
  return (privatePlayer.originalRoleId ?? privatePlayer.roleId) === "sheriff";
}

function wasDeputyAlreadyPromoted(
  privatePlayer: PrivatePlayerRecord,
): boolean {
  return privatePlayer.roleId === "sheriff"
    && privatePlayer.originalRoleId === "deputy";
}

export function selectDeputyPromotion(
  players: Readonly<Record<string, PublicPlayerRecord>>,
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>>,
  random: RandomValueSource = Math.random,
): DeputyPromotion | null {
  const originalSheriffUids = Object.entries(privatePlayers)
    .filter(([, privatePlayer]) => isOriginalSheriff(privatePlayer))
    .map(([uid]) => uid);

  const everyOriginalSheriffIsDead = originalSheriffUids.length > 0
    && originalSheriffUids.every((uid) => players[uid]?.alive === false);
  const promotionAlreadyHappened = Object.values(privatePlayers).some(
    wasDeputyAlreadyPromoted,
  );

  if (!everyOriginalSheriffIsDead || promotionAlreadyHappened) {
    return null;
  }

  const candidateUids = Object.entries(privatePlayers)
    .filter(([uid, privatePlayer]) =>
      privatePlayer.roleId === "deputy" && players[uid]?.alive === true
    )
    .map(([uid]) => uid)
    .sort();

  if (candidateUids.length === 0) {
    return null;
  }

  const randomValue = random();
  const normalizedRandomValue = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON)
    : 0;
  const selectedIndex = Math.floor(normalizedRandomValue * candidateUids.length);

  return {
    playerUid: candidateUids[selectedIndex],
    candidateUids,
  };
}
