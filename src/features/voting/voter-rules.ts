import { canBlackmailedPlayerVote } from "@/game-engine/day-effects";
import { getVerdictVoteWeight } from "@/game-engine/role-rules";
import { getForcedVerdict } from "@/game-engine/role-rules";
import type { GameVariants } from "@/game-engine/variants";
import type { PrivatePlayerRecord, PublicPlayerRecord, VerdictVote } from "@/lib/firebase/schema";

export function getEffectiveVerdicts(
  votes: Readonly<Record<string, VerdictVote>> | undefined,
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>>,
): Record<string, VerdictVote> {
  return Object.fromEntries(Object.entries(votes ?? {}).map(([uid, vote]) => [
    uid,
    getForcedVerdict(privatePlayers[uid]?.roleId ?? "") ?? vote,
  ]));
}

export function getEligibleVoterUids(
  players: Readonly<Record<string, PublicPlayerRecord>>,
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>>,
  variants: GameVariants,
  accusedPlayerUid?: string | null,
): Set<string> {
  return new Set(Object.entries(players)
    .filter(([uid, player]) => {
      const statuses = Object.keys(privatePlayers[uid]?.statuses ?? {});
      return player.alive
        && uid !== accusedPlayerUid
        && canBlackmailedPlayerVote(statuses, variants);
    })
    .map(([uid]) => uid));
}

export function getVoterWeights(
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>>,
  playerCount: number,
): Record<string, number> {
  return Object.fromEntries(Object.entries(privatePlayers).map(([uid, player]) => [
    uid,
    getVerdictVoteWeight(
      player.roleId,
      Object.keys(player.statuses ?? {}),
      playerCount,
    ),
  ]));
}
