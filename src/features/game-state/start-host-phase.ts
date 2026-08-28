"use client";

import {
  readGamePlayers,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import type { PlayablePhase } from "@/types";

import { createPhaseSession } from "./create-phase-session";
import { selectDeputyPromotion } from "./deputy-promotion";
import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export interface StartHostPhaseInput {
  phaseId: PlayablePhase | "custom";
  label: string;
  durationSeconds: number | null;
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

  const startedAt = now();
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

  await applyAtomicUpdate({
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
    ...Object.fromEntries(
      Object.entries(privatePlayers ?? {})
        .filter(([, player]) => player.statuses?.blackmailed)
        .map(([uid]) => [
          firebasePaths.gamePrivatePlayerStatus(gameId, uid, "blackmailed"),
          null,
        ]),
    ),
  });
}
