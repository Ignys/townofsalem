import type { VerdictVote } from "@/lib/firebase/schema";
import type { GameVariants } from "./variants";

export interface JesterRevengeResult {
  valid: boolean;
  killedPlayerUid: string | null;
  reasonCode: string;
  unavoidable: true;
}

export function resolveJesterRevenge(
  votes: Readonly<Record<string, VerdictVote>>,
  selectedPlayerUid: string,
): JesterRevengeResult {
  if (votes[selectedPlayerUid] !== "guilty") {
    return {
      valid: false,
      killedPlayerUid: null,
      reasonCode: "JESTER_TARGET_DID_NOT_VOTE_GUILTY",
      unavoidable: true,
    };
  }
  return {
    valid: true,
    killedPlayerUid: selectedPlayerUid,
    reasonCode: "JESTER_REVENGE_IS_UNAVOIDABLE",
    unavoidable: true,
  };
}

export function canBlackmailedPlayerVote(
  statuses: readonly string[],
  variants: Pick<GameVariants, "blackmailedCannotVote">,
): boolean {
  return !statuses.includes("blackmailed") || !variants.blackmailedCannotVote;
}
