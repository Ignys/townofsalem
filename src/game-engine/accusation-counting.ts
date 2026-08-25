import type { AccusationVotingSettings } from "@/features/voting/voting-settings";

export type AccusationVotes = Record<string, string>;

export function countAccusationVotes(
  votes: AccusationVotes | null | undefined,
  eligibleVoterUids?: ReadonlySet<string>,
): Record<string, number> {
  return Object.entries(votes ?? {}).reduce<Record<string, number>>(
    (counts, [voterUid, targetUid]) => {
      if (eligibleVoterUids && !eligibleVoterUids.has(voterUid)) {
        return counts;
      }

      counts[targetUid] = (counts[targetUid] ?? 0) + 1;
      return counts;
    },
    {},
  );
}

export function getVotesRequired(
  alivePlayers: number,
  settings: AccusationVotingSettings,
): number {
  if (!Number.isInteger(alivePlayers) || alivePlayers < 0) {
    throw new Error("alivePlayers must be a non-negative integer.");
  }

  if (alivePlayers === 0) {
    return 0;
  }

  if (settings.thresholdMode === "strict-majority") {
    return Math.floor(alivePlayers / 2) + 1;
  }

  if (settings.thresholdMode === "two-thirds") {
    return Math.ceil((alivePlayers * 2) / 3);
  }

  const fixedVotes = settings.fixedVotesRequired;

  if (!Number.isInteger(fixedVotes) || (fixedVotes ?? 0) < 1) {
    throw new Error("fixedVotesRequired must be a positive integer.");
  }

  return fixedVotes as number;
}
