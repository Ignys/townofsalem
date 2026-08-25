import type {
  VerdictOutcome,
  VerdictVote,
} from "@/lib/firebase/schema";

import type { VerdictVotingSettings } from "@/features/voting/voting-settings";

export interface VerdictCounts {
  guilty: number;
  innocent: number;
  abstain: number;
}

export interface VerdictResult {
  counts: VerdictCounts;
  outcome: VerdictOutcome;
}

export function countVerdictVotes(
  votes: Record<string, VerdictVote> | null | undefined,
  eligibleVoterUids?: ReadonlySet<string>,
): VerdictCounts {
  return Object.entries(votes ?? {}).reduce<VerdictCounts>(
    (counts, [voterUid, vote]) =>
      eligibleVoterUids && !eligibleVoterUids.has(voterUid)
        ? counts
        : { ...counts, [vote]: counts[vote] + 1 },
    { guilty: 0, innocent: 0, abstain: 0 },
  );
}

export function calculateVerdictResult(
  votes: Record<string, VerdictVote> | null | undefined,
  settings: VerdictVotingSettings,
  eligibleVoterUids?: ReadonlySet<string>,
): VerdictResult {
  const counts = countVerdictVotes(votes, eligibleVoterUids);
  let outcome: VerdictOutcome;

  if (counts.guilty > counts.innocent) {
    outcome = "guilty";
  } else if (counts.innocent > counts.guilty) {
    outcome = "innocent";
  } else {
    outcome = settings.tieBehavior === "acquit" ? "innocent" : "tie";
  }

  return { counts, outcome };
}

export function isPlayerEligibleForVerdict(
  playerUid: string,
  alive: boolean,
  accusedPlayerUid: string | null | undefined,
  settings: VerdictVotingSettings,
): boolean {
  return alive && (settings.accusedCanVote || playerUid !== accusedPlayerUid);
}
