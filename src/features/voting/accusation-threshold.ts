import {
  countAccusationVotes,
  getVotesRequired,
  type AccusationVotes,
} from "@/game-engine/accusation-counting";
import type { GameVariants } from "@/game-engine/variants";
import type { PrivatePlayerRecord, PublicPlayerRecord } from "@/lib/firebase/schema";

import { getEligibleVoterUids, getVoterWeights } from "./voter-rules";
import {
  DEFAULT_ACCUSATION_VOTING_SETTINGS,
  type AccusationVotingSettings,
} from "./voting-settings";

export interface AccusationTally {
  targetUid: string;
  votes: number;
}

export interface AccusationTrigger {
  targetUid: string;
  votes: number;
  votesRequired: number;
}

export interface AccusationThresholdInput {
  accusations: AccusationVotes | null | undefined;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>>;
  variants: GameVariants;
  settings?: AccusationVotingSettings;
}

function countWeighted({
  accusations,
  players,
  privatePlayers,
  variants,
}: AccusationThresholdInput): Record<string, number> {
  return countAccusationVotes(
    accusations,
    getEligibleVoterUids(players, privatePlayers, variants),
    getVoterWeights(privatePlayers, Object.keys(players).length),
  );
}

/** Contagem ordenada, para exibir o placar ao vivo. */
export function getAccusationTallies(input: AccusationThresholdInput): readonly AccusationTally[] {
  return Object.entries(countWeighted(input))
    .map(([targetUid, votes]) => ({ targetUid, votes }))
    .sort(
      (left, right) =>
        right.votes - left.votes ||
        (input.players[left.targetUid]?.name ?? "").localeCompare(
          input.players[right.targetUid]?.name ?? "",
          "pt-BR",
        ),
    );
}

export function getAccusationVotesRequired(
  players: Readonly<Record<string, PublicPlayerRecord>>,
  settings: AccusationVotingSettings = DEFAULT_ACCUSATION_VOTING_SETTINGS,
): number {
  return getVotesRequired(
    Object.values(players).filter((player) => player.alive).length,
    settings,
  );
}

/**
 * O alvo que atingiu o limiar, ou `null`.
 *
 * Um empate no limiar devolve `null`: dois jogadores não podem ser "o" acusado, e nesse
 * caso o jogo continua até alguém trocar o voto.
 */
export function selectAccusationTrigger(
  input: AccusationThresholdInput,
): AccusationTrigger | null {
  const settings = input.settings ?? DEFAULT_ACCUSATION_VOTING_SETTINGS;
  const votesRequired = getAccusationVotesRequired(input.players, settings);

  if (votesRequired <= 0) return null;

  const reached = Object.entries(countWeighted(input)).filter(
    ([targetUid, votes]) => votes >= votesRequired && input.players[targetUid]?.alive,
  );

  if (reached.length !== 1) return null;

  const [targetUid, votes] = reached[0];
  return { targetUid, votes, votesRequired };
}
