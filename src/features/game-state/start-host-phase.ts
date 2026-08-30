"use client";

import {
  readGamePlayers,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate, type AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";
import type { GamePublicRecord, PrivatePlayerRecord, PublicPlayerRecord } from "@/lib/firebase/schema";
import type { PlayablePhase } from "@/types";

import { isAccusationPhase } from "@/features/voting/voting-phases";

import { createPhaseSession } from "./create-phase-session";
import { selectDeputyPromotion } from "./deputy-promotion";
import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export interface StartHostPhaseInput {
  phaseId: PlayablePhase | "custom";
  label: string;
  durationSeconds: number | null;
}

export interface BuildStartHostPhaseUpdatesInput {
  gameId: string;
  hostUid: string;
  game: GamePublicRecord;
  input: StartHostPhaseInput;
  players?: Readonly<Record<string, PublicPlayerRecord>> | null;
  privatePlayers?: Readonly<Record<string, PrivatePlayerRecord>> | null;
  startedAt: number;
  createId?: () => string;
  random?: () => number;
}

/**
 * Monta o update atômico de início de fase.
 *
 * Extraído de `startHostPhase` para que `startAccusedTrial` possa entrar em `trial`
 * pelo mesmo caminho, preservando PhaseSession, `phaseSequenceNumber`, `PHASE_STARTED`
 * e a limpeza de `blackmailed`.
 */
export function buildStartHostPhaseUpdates({
  gameId,
  hostUid,
  game,
  input,
  players = null,
  privatePlayers = null,
  startedAt,
  createId = () => crypto.randomUUID(),
  random = Math.random,
}: BuildStartHostPhaseUpdatesInput): AtomicUpdateMap {
  const phaseSessionId = createId();
  const nightId = input.phaseId === "night" ? createId() : undefined;
  const eventId = createId();
  const created = createPhaseSession(game, {
    ...input,
    startedAt,
    phaseSessionId,
    nightId,
  });
  const deputyPromotion = input.phaseId === "night" && players && privatePlayers
    ? selectDeputyPromotion(players, privatePlayers, random)
    : null;
  const nightSession = created.nightSession && deputyPromotion
    ? {
        ...created.nightSession,
        deputyPromotion: {
          ...deputyPromotion,
          promotedAt: startedAt,
        },
      }
    : created.nightSession;
  const deputyPromotionEventId = deputyPromotion ? createId() : null;

  // Sair do julgamento limpa o acusado; caso contrário a regra `!accusedPlayerUid`
  // bloquearia permanentemente novas acusações.
  const clearsAccusation = isAccusationPhase(created.phase) || created.phase === "night";

  return {
    [firebasePaths.gamePublicField(gameId, "phase")]: created.phase,
    [firebasePaths.gamePublicField(gameId, "phaseLabel")]: created.phaseSession.label,
    [firebasePaths.gamePublicField(gameId, "phaseSessionId")]: phaseSessionId,
    [firebasePaths.gamePublicField(gameId, "currentNightId")]: nightId ?? null,
    [firebasePaths.gamePublicField(gameId, "phaseSequenceNumber")]: created.nextPhaseSequenceNumber,
    [firebasePaths.gamePublicField(gameId, "nightNumber")]: created.nextNightNumber,
    [firebasePaths.gamePublicField(gameId, "phaseEndsAt")]: created.phaseEndsAt,
    [firebasePaths.gamePublicField(gameId, "timerPaused")]: false,
    [firebasePaths.gamePublicField(gameId, "timerRemainingMs")]: null,
    [firebasePaths.gamePhaseSession(gameId, phaseSessionId)]: created.phaseSession,
    ...(nightSession
      ? { [firebasePaths.gameNightSession(gameId, nightSession.id)]: nightSession }
      : {}),
    [firebasePaths.gameEvent(gameId, eventId)]: {
      type: "PHASE_STARTED",
      timestamp: startedAt,
      actorUid: hostUid,
      visibility: "host-only",
      payload: {
        phaseId: created.phase,
        phaseSessionId,
        nightId: nightId ?? null,
        durationSeconds: input.durationSeconds,
      },
    },
    ...(deputyPromotion && deputyPromotionEventId && nightId
      ? {
          [firebasePaths.gamePrivatePlayerField(
            gameId,
            deputyPromotion.playerUid,
            "roleId",
          )]: "sheriff",
          [firebasePaths.gamePrivatePlayerField(
            gameId,
            deputyPromotion.playerUid,
            "faction",
          )]: "town",
          [firebasePaths.gameEvent(gameId, deputyPromotionEventId)]: {
            type: "DEPUTY_PROMOTED_TO_SHERIFF",
            timestamp: startedAt,
            actorUid: hostUid,
            visibility: "host-only",
            payload: {
              nightId,
              playerUid: deputyPromotion.playerUid,
              candidateUids: [...deputyPromotion.candidateUids],
            },
          },
        }
      : {}),
    ...(clearsAccusation
      ? {
          [firebasePaths.gamePublicField(gameId, "accusedPlayerUid")]: null,
          [firebasePaths.gamePublicField(gameId, "verdictClosedAt")]: null,
          [firebasePaths.gamePublicField(gameId, "verdictOutcome")]: null,
        }
      : {}),
    ...Object.fromEntries(
      Object.entries(privatePlayers ?? {})
        .filter(([, player]) => player.statuses?.blackmailed)
        .map(([uid]) => [
          firebasePaths.gamePrivatePlayerStatus(gameId, uid, "blackmailed"),
          null,
        ]),
    ),
  };
}

export async function startHostPhase(
  gameId: string,
  input: StartHostPhaseInput,
  now: () => number = Date.now,
  createId: () => string = () => crypto.randomUUID(),
  random: () => number = Math.random,
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const [game, players, privatePlayers] = await Promise.all([
    readPublicGame(gameId),
    input.phaseId === "night" ? readGamePlayers(gameId) : null,
    input.phaseId === "night" ? readHostPrivatePlayers(gameId) : null,
  ]);

  if (!game || game.status !== "in-progress") {
    throw new Error("game-not-in-progress");
  }

  await applyAtomicUpdate(
    buildStartHostPhaseUpdates({
      gameId,
      hostUid,
      game,
      input,
      players,
      privatePlayers,
      startedAt: now(),
      createId,
      random,
    }),
  );
}
