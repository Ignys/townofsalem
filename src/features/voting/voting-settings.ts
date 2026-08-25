export type AccusationThresholdMode =
  | "strict-majority"
  | "two-thirds"
  | "fixed";

export interface AccusationVotingSettings {
  thresholdMode: AccusationThresholdMode;
  fixedVotesRequired?: number;
}

export type VerdictTieBehavior = "no-decision" | "acquit";

export interface VerdictVotingSettings {
  accusedCanVote: boolean;
  tieBehavior: VerdictTieBehavior;
}

// Regras de produto explícitas. Não representam uma fórmula oficial do jogo.
export const DEFAULT_ACCUSATION_VOTING_SETTINGS: AccusationVotingSettings = {
  thresholdMode: "strict-majority",
};

export const DEFAULT_VERDICT_VOTING_SETTINGS: VerdictVotingSettings = {
  accusedCanVote: false,
  tieBehavior: "no-decision",
};
