"use client";

import { runTransaction } from "firebase/database";

import {
  readGameDayVotes,
  readGamePlayers,
  readGameSettings,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import { getDatabaseReference } from "@/lib/firebase/references";
import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import { buildStartHostPhaseUpdates } from "@/features/game-state/start-host-phase";
import { getPhaseDefinition } from "@/features/game-state/phase-definitions";
import { withDefaultVariants } from "@/game-engine/variants";

import { selectAccusationTrigger } from "./accusation-threshold";
import { isAccusationPhase } from "./voting-phases";
import { DEFAULT_ACCUSATION_VOTING_SETTINGS } from "./voting-settings";

/**
 * Coloca um jogador em julgamento quando a maioria o acusou.
 *
 * O jogo "para": a fase vira `trial` sem timer (`phaseEndsAt` nulo), porque o mestre
 * precisa interromper a conversa presencial antes de iniciar a defesa de 30s.
 *
 * Idempotente entre abas: o acusado é reivindicado por transação, e quem perder
 * simplesmente retorna sem escrever.
 */
export async function startAccusedTrial(
  gameId: string,
  targetUid: string,
  now: () => number = Date.now,
  createId: () => string = () => crypto.randomUUID(),
): Promise<boolean> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const game = await readPublicGame(gameId);

  if (
    !game ||
    game.status !== "in-progress" ||
    !isAccusationPhase(game.phase) ||
    game.accusedPlayerUid
  ) {
    throw new Error("The game is not accepting an accusation trial.");
  }

  const [players, dayVotes, privatePlayers, settings] = await Promise.all([
    readGamePlayers(gameId),
    readGameDayVotes(gameId, game.day),
    readHostPrivatePlayers(gameId),
    readGameSettings(gameId),
  ]);

  if (!players?.[targetUid]?.alive) {
    throw new Error("The accused player is not alive.");
  }

  // Revalidação server-side do limiar: a UI é só um gatilho.
  const trigger = selectAccusationTrigger({
    accusations: dayVotes?.accusations,
    players: players ?? {},
    privatePlayers: privatePlayers ?? {},
    variants: withDefaultVariants(settings?.gameVariants),
    settings: DEFAULT_ACCUSATION_VOTING_SETTINGS,
  });

  if (!trigger || trigger.targetUid !== targetUid) {
    throw new Error("The accusation threshold is no longer satisfied.");
  }

  // Reivindica o acusado; se outra aba já reivindicou, desiste em silêncio.
  const claim = await runTransaction(
    getDatabaseReference(firebasePaths.gamePublicField(gameId, "accusedPlayerUid")),
    (current: string | null) => (current ? undefined : targetUid),
    { applyLocally: false },
  );

  if (!claim.committed) return false;

  const startedAt = now();
  const eventId = createId();
  const trialPhase = getPhaseDefinition("trial");

  await applyAtomicUpdate({
    ...buildStartHostPhaseUpdates({
      gameId,
      hostUid,
      game,
      // Sem timer: o mestre inicia a fase Defesa manualmente depois de calar a mesa.
      input: { phaseId: "trial", label: trialPhase.label, durationSeconds: null },
      startedAt,
      createId,
    }),
    [firebasePaths.gamePublicField(gameId, "accusedPlayerUid")]: targetUid,
    [firebasePaths.gamePublicField(gameId, "verdictClosedAt")]: null,
    [firebasePaths.gamePublicField(gameId, "verdictOutcome")]: null,
    [firebasePaths.gameAccusations(gameId, game.day)]: null,
    [firebasePaths.gameVerdicts(gameId, game.day)]: null,
    [firebasePaths.gameEvent(gameId, eventId)]: {
      type: "TRIAL_STARTED",
      timestamp: startedAt,
      actorUid: hostUid,
      visibility: "host-only",
      payload: {
        accusedPlayerUid: targetUid,
        day: game.day,
        votes: trigger.votes,
        votesRequired: trigger.votesRequired,
      },
    },
  });

  return true;
}
