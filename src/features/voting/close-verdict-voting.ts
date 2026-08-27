"use client";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import {
  readGameDayVotes,
  readGamePlayers,
  readGameSettings,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import { calculateVerdictResult } from "@/game-engine/verdict-result";
import { DEFAULT_VERDICT_VOTING_SETTINGS } from "./voting-settings";
import { withDefaultVariants } from "@/game-engine/variants";
import { getEffectiveVerdicts, getEligibleVoterUids, getVoterWeights } from "./voter-rules";

export async function closeVerdictVoting(
  gameId: string,
  now: () => number = Date.now,
): Promise<void> {
  await requireAuthenticatedGameHost(gameId);
  const game = await readPublicGame(gameId);

  if (
    !game ||
    game.status !== "in-progress" ||
    game.phase !== "verdict" ||
    !game.accusedPlayerUid ||
    game.verdictClosedAt
  ) {
    throw new Error("The verdict cannot be closed in the current state.");
  }

  const [votes, players, privatePlayers, settings] = await Promise.all([
    readGameDayVotes(gameId, game.day),
    readGamePlayers(gameId),
    readHostPrivatePlayers(gameId),
    readGameSettings(gameId),
  ]);
  const variants = withDefaultVariants(settings?.gameVariants);
  const eligibleVoterUids = getEligibleVoterUids(
    players ?? {},
    privatePlayers ?? {},
    variants,
    DEFAULT_VERDICT_VOTING_SETTINGS.accusedCanVote ? null : game.accusedPlayerUid,
  );
  const result = calculateVerdictResult(
    getEffectiveVerdicts(votes?.verdicts, privatePlayers ?? {}),
    DEFAULT_VERDICT_VOTING_SETTINGS,
    eligibleVoterUids,
    getVoterWeights(privatePlayers ?? {}, Object.keys(players ?? {}).length),
  );

  await applyAtomicUpdate({
    [firebasePaths.gamePublicField(gameId, "verdictClosedAt")]: now(),
    [firebasePaths.gamePublicField(gameId, "verdictOutcome")]: result.outcome,
  });
}
