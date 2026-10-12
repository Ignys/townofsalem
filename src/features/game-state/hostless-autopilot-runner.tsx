"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import { createEngineGameState } from "@/game-engine/host-action-adapter";
import { checkWinCondition } from "@/game-engine/win-condition";
import type { Player } from "@/types";

import { useSynchronizedTimer } from "@/features/timer/use-synchronized-timer";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import { canActTonight, isNightComplete } from "@/features/night-actions/night-readiness";
import { getEligibleVoterUids } from "@/features/voting/voter-rules";
import { DEFAULT_VERDICT_VOTING_SETTINGS } from "@/features/voting/voting-settings";
import {
  observeHostJesterRevenges,
  observeHostNightPasses,
  observeHostPlayerNightActions,
  observePublicVerdicts,
} from "@/lib/firebase/realtime-database-repository";
import type { GamePace, GamePublicRecord, PublicPlayerRecord, VerdictVote } from "@/lib/firebase/schema";

import { JESTER_REVENGE_STATUS } from "./apply-jester-revenge";
import {
  decideHostlessStep,
  HOSTLESS_PACE_SECONDS,
  HOSTLESS_PHASE_LABELS,
  type HostlessStep,
  type PendingJesterRevenge,
} from "./hostless-autopilot";
import { getPhaseDefinition } from "./phase-definitions";

/** Encurta os timers nos testes end-to-end; em produção fica 1. */
const TIMER_SCALE = Number(process.env.NEXT_PUBLIC_HOSTLESS_TIMER_SCALE) || 1;

function scaled(seconds: number | undefined): number | null {
  return seconds ? Math.max(1, Math.round(seconds * TIMER_SCALE)) : null;
}

/** Espera antes de tentar de novo um passo que falhou (ex.: ações ainda sendo salvas). */
const RETRY_DELAY_MS = 3_000;

async function runStep(gameId: string, step: HostlessStep, serverTimeOffsetMs: number, pace: GamePace): Promise<void> {
  const seconds = HOSTLESS_PACE_SECONDS[pace];
  switch (step.kind) {
    case "start-timer": {
      const { controlGameTimer } = await import("@/features/timer/control-game-timer");
      await controlGameTimer(gameId, { type: "start", durationMs: (scaled(step.seconds) ?? 1) * 1000 }, serverTimeOffsetMs);
      return;
    }
    case "end-night": {
      const { applyNightBeforeLeaving } = await import("@/features/night-actions/night-apply-registry");
      const outcome = await applyNightBeforeLeaving(gameId);
      if (outcome.kind === "blocked") throw new Error(outcome.reason);
      const { startHostPhase } = await import("./start-host-phase");
      await startHostPhase(gameId, {
        phaseId: "discussion",
        label: getPhaseDefinition("discussion").label,
        durationSeconds: scaled(seconds.discussion),
      });
      return;
    }
    case "start-night": {
      const { startHostPhase } = await import("./start-host-phase");
      await startHostPhase(gameId, {
        phaseId: "night",
        label: getPhaseDefinition("night").label,
        durationSeconds: scaled(seconds.night),
      });
      return;
    }
    case "start-verdict": {
      const { startHostPhase } = await import("./start-host-phase");
      await startHostPhase(gameId, {
        phaseId: "verdict",
        label: HOSTLESS_PHASE_LABELS.verdict,
        durationSeconds: scaled(seconds.verdict),
      });
      return;
    }
    case "declare-winner": {
      const { declareWinner } = await import("./declare-winner");
      await declareWinner(gameId, step);
      return;
    }
    case "resolve-jester-revenge": {
      const { applyJesterRevenge } = await import("./apply-jester-revenge");
      await applyJesterRevenge(gameId, step.jesterUid, step.targetUid);
      return;
    }
    case "close-verdict": {
      const { closeVerdictVoting } = await import("@/features/voting/close-verdict-voting");
      await closeVerdictVoting(gameId);
      return;
    }
    case "apply-lynch": {
      const { applyDayResolution } = await import("./apply-day-resolution");
      await applyDayResolution(gameId, { targetUid: step.targetUid, kind: "lynch", deferJesterRevenge: true });
      return;
    }
  }
}

/**
 * Ritmo rápido: a noite acaba quando todos que têm ação confirmaram ou passaram, e o
 * veredito fecha quando todos os eleitores votaram.
 */
function useFastTrackSignals(
  gameId: string,
  hostUid: string,
  game: GamePublicRecord,
  players: Readonly<Record<string, PublicPlayerRecord>>,
  enabled: boolean,
) {
  const privateRoles = useHostRoleAssignments(gameId, hostUid);
  const gameVariants = useGameVariants(gameId);
  const nightId = enabled && game.phase === "night" ? game.currentNightId ?? null : null;
  const verdictDay = enabled && game.phase === "verdict" && !game.verdictClosedAt ? game.day : null;
  const [submissions, setSubmissions] = useState<Record<string, unknown>>({});
  const [passes, setPasses] = useState<Record<string, number>>({});
  const [verdicts, setVerdicts] = useState<Record<string, VerdictVote>>({});

  useEffect(() => {
    if (!nightId) return;
    const stopSubmissions = observeHostPlayerNightActions(gameId, nightId, hostUid, {
      onData: (value) => setSubmissions(value ?? {}),
      onError: () => setSubmissions({}),
    });
    const stopPasses = observeHostNightPasses(gameId, nightId, hostUid, {
      onData: (value) => setPasses(value ?? {}),
      onError: () => setPasses({}),
    });
    return () => {
      stopSubmissions();
      stopPasses();
    };
  }, [gameId, hostUid, nightId]);

  useEffect(() => {
    if (verdictDay === null) return;
    return observePublicVerdicts(gameId, verdictDay, {
      onData: (value) => setVerdicts(value ?? {}),
      onError: () => setVerdicts({}),
    });
  }, [gameId, verdictDay]);

  return useMemo(() => {
    if (!enabled || !privateRoles.loaded || !gameVariants.loaded) {
      return { nightComplete: false, allVerdictsIn: false };
    }
    const playerCount = gameVariants.roleCount ?? Object.keys(players).length;
    const actorUids = nightId
      ? Object.entries(players)
        .filter(([uid, player]) => {
          const assignment = privateRoles.assignments[uid];
          return assignment && canActTonight(
            { id: uid, uid, ...player },
            assignment.roleId,
            game.nightNumber ?? 1,
            gameVariants.variants,
            playerCount,
            assignment.resourceUses,
          );
        })
        .map(([uid]) => uid)
      : [];
    const voterUids = verdictDay !== null
      ? getEligibleVoterUids(
        players,
        privateRoles.assignments,
        gameVariants.variants,
        DEFAULT_VERDICT_VOTING_SETTINGS.accusedCanVote ? null : game.accusedPlayerUid ?? null,
      )
      : new Set<string>();
    return {
      nightComplete: Boolean(nightId) && isNightComplete(actorUids, new Set(Object.keys(submissions)), new Set(Object.keys(passes))),
      allVerdictsIn: verdictDay !== null && voterUids.size > 0 && [...voterUids].every((uid) => Boolean(verdicts[uid])),
    };
  }, [enabled, game.accusedPlayerUid, game.nightNumber, gameVariants, nightId, passes, players, privateRoles, submissions, verdictDay, verdicts]);
}

interface HostlessAutopilotRunnerProps {
  gameId: string;
  hostUid: string;
  game: GamePublicRecord;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

/**
 * Conduz a partida sem mestre: a cada tick decide o próximo passo e o executa uma vez.
 * Não renderiza nada; roda no computador da mesa.
 */
export function HostlessAutopilotRunner({ gameId, hostUid, game, players }: HostlessAutopilotRunnerProps) {
  const timer = useSynchronizedTimer(game);
  const privateRoles = useHostRoleAssignments(gameId, hostUid);
  const winner = useMemo(() => {
    if (!privateRoles.loaded || Object.keys(privateRoles.assignments).length === 0) return null;
    const roster: Player[] = Object.entries(players).map(([uid, player]) => ({ id: uid, uid, ...player }));
    const assignments = Object.fromEntries(
      Object.entries(privateRoles.assignments).map(([uid, assignment]) => [uid, assignment.roleId]),
    );
    return checkWinCondition(createEngineGameState({
      gameId,
      nightId: game.currentNightId ?? "hostless-win-check",
      players: roster,
      assignments,
      privatePlayerStates: privateRoles.assignments,
      roleDefinitions: ROLE_DEFINITIONS,
    }));
  }, [game.currentNightId, gameId, players, privateRoles.assignments, privateRoles.loaded]);
  const inFlightRef = useRef<string | null>(null);
  const [revengeChoices, setRevengeChoices] = useState<Record<string, string>>({});
  useEffect(
    () => observeHostJesterRevenges(gameId, game.day, hostUid, {
      onData: (value) => setRevengeChoices(value ?? {}),
      onError: () => setRevengeChoices({}),
    }),
    [game.day, gameId, hostUid],
  );
  const jesterRevenge = useMemo<PendingJesterRevenge | null>(() => {
    const jesterUid = Object.entries(privateRoles.assignments).find(
      ([, assignment]) => assignment.statuses?.[JESTER_REVENGE_STATUS],
    )?.[0];
    return jesterUid ? { jesterUid, targetUid: revengeChoices[jesterUid] ?? null } : null;
  }, [privateRoles.assignments, revengeChoices]);

  const pace: GamePace = game.gamePace ?? "relaxed";
  const fastTrack = useFastTrackSignals(gameId, hostUid, game, players, pace === "fast");

  const step = decideHostlessStep(
    game,
    timer.status,
    (uid) => Boolean(players[uid]?.alive),
    timer.serverAdjustedNow,
    winner,
    jesterRevenge,
    pace,
    fastTrack,
  );
  // Um passo por fase/estado: o tick repete a decisão, mas só a primeira execução vale.
  const stepKey = step
    ? `${game.phaseSessionId ?? ""}:${game.phase}:${game.verdictClosedAt ?? ""}:${step.kind}:${"targetUid" in step ? step.targetUid ?? "" : ""}`
    : null;

  useEffect(() => {
    if (!step || !stepKey || inFlightRef.current === stepKey) return;
    if (step.kind === "start-timer" && !timer.serverOffsetAvailable) return;

    inFlightRef.current = stepKey;
    runStep(gameId, step, timer.serverTimeOffsetMs, pace).catch((error: unknown) => {
      console.warn("[HostlessAutopilot] Passo falhou; tentando de novo.", { step, error });
      setTimeout(() => {
        if (inFlightRef.current === stepKey) inFlightRef.current = null;
      }, RETRY_DELAY_MS);
    });
  }, [gameId, pace, step, stepKey, timer.serverOffsetAvailable, timer.serverTimeOffsetMs]);

  return null;
}
