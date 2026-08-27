"use client";

import { canTransition } from "@/game-engine/game-phase-machine";
import {
  readGameDayVotes,
  readGamePlayers,
  readGameSettings,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";

import {
  countAccusationVotes,
  getVotesRequired,
} from "@/game-engine/accusation-counting";
import { DEFAULT_ACCUSATION_VOTING_SETTINGS } from "./voting-settings";
import { withDefaultVariants } from "@/game-engine/variants";
import { getEligibleVoterUids, getVoterWeights } from "./voter-rules";

export async function startAccusedTrial(
  gameId: string,
  targetUid: string,
): Promise<void> {
  await requireAuthenticatedGameHost(gameId);
  const game = await readPublicGame(gameId);

  if (
    !game ||
    game.status !== "in-progress" ||
    game.phase !== "discussion" ||
    !canTransition(game.phase, "trial")
  ) {
    throw new Error("The game is not accepting an accusation trial.");
  }

  const [players, dayVotes, privatePlayers, settings] = await Promise.all([
    readGamePlayers(gameId),
    readGameDayVotes(gameId, game.day),
    readHostPrivatePlayers(gameId),
    readGameSettings(gameId),
  ]);
  const target = players?.[targetUid];

  if (!target?.alive) {
    throw new Error("The accused player is not alive.");
  }

  const alivePlayers = Object.values(players ?? {}).filter(
    (player) => player.alive,
  ).length;
  const eligibleVoterUids = getEligibleVoterUids(
    players ?? {},
    privatePlayers ?? {},
    withDefaultVariants(settings?.gameVariants),
  );
  const votesForTarget = countAccusationVotes(
    dayVotes?.accusations,
    eligibleVoterUids,
    getVoterWeights(privatePlayers ?? {}, Object.keys(players ?? {}).length),
  )[targetUid] ?? 0;
  const votesRequired = getVotesRequired(
    alivePlayers,
    DEFAULT_ACCUSATION_VOTING_SETTINGS,
  );

  if (votesForTarget < votesRequired) {
    throw new Error("The accusation threshold is no longer satisfied.");
  }

  await applyAtomicUpdate({
    [firebasePaths.gamePublicField(gameId, "accusedPlayerUid")]: targetUid,
    [firebasePaths.gamePublicField(gameId, "verdictClosedAt")]: null,
    [firebasePaths.gamePublicField(gameId, "verdictOutcome")]: null,
    [firebasePaths.gamePublicField(gameId, "phase")]: "trial",
    [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]: null,
    [firebasePaths.gamePublicField(gameId, "timerPaused")]: false,
    [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]: null,
    [firebasePaths.gameAccusations(gameId, game.day)]: null,
    [firebasePaths.gameVerdicts(gameId, game.day)]: null,
  });
}
