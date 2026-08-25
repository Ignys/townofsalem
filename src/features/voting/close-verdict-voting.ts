"use client";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import {
  readGameDayVotes,
  readGamePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import { calculateVerdictResult } from "@/game-engine/verdict-result";
import { DEFAULT_VERDICT_VOTING_SETTINGS } from "./voting-settings";

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

  const [votes, players] = await Promise.all([
    readGameDayVotes(gameId, game.day),
    readGamePlayers(gameId),
  ]);
  const eligibleVoterUids = new Set(
    Object.entries(players ?? {})
      .filter(
        ([playerUid, player]) =>
          player.alive &&
          (DEFAULT_VERDICT_VOTING_SETTINGS.accusedCanVote ||
            playerUid !== game.accusedPlayerUid),
      )
      .map(([playerUid]) => playerUid),
  );
  const result = calculateVerdictResult(
    votes?.verdicts,
    DEFAULT_VERDICT_VOTING_SETTINGS,
    eligibleVoterUids,
  );

  await applyAtomicUpdate({
    [firebasePaths.gamePublicField(gameId, "verdictClosedAt")]: now(),
    [firebasePaths.gamePublicField(gameId, "verdictOutcome")]: result.outcome,
  });
}
