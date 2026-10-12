"use client";

import { useEffect, useRef } from "react";

import { useSynchronizedTimer } from "@/features/timer/use-synchronized-timer";
import type { GamePublicRecord, PublicPlayerRecord } from "@/lib/firebase/schema";

import { decideHostlessStep, HOSTLESS_PHASE_LABELS, HOSTLESS_PHASE_SECONDS, type HostlessStep } from "./hostless-autopilot";
import { getPhaseDefinition } from "./phase-definitions";

/** Encurta os timers nos testes end-to-end; em produção fica 1. */
const TIMER_SCALE = Number(process.env.NEXT_PUBLIC_HOSTLESS_TIMER_SCALE) || 1;

function scaled(seconds: number | undefined): number | null {
  return seconds ? Math.max(1, Math.round(seconds * TIMER_SCALE)) : null;
}

/** Espera antes de tentar de novo um passo que falhou (ex.: ações ainda sendo salvas). */
const RETRY_DELAY_MS = 3_000;

async function runStep(gameId: string, step: HostlessStep, serverTimeOffsetMs: number): Promise<void> {
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
        durationSeconds: scaled(HOSTLESS_PHASE_SECONDS.discussion),
      });
      return;
    }
    case "start-night": {
      const { startHostPhase } = await import("./start-host-phase");
      await startHostPhase(gameId, {
        phaseId: "night",
        label: getPhaseDefinition("night").label,
        durationSeconds: scaled(HOSTLESS_PHASE_SECONDS.night),
      });
      return;
    }
    case "start-verdict": {
      const { startHostPhase } = await import("./start-host-phase");
      await startHostPhase(gameId, {
        phaseId: "verdict",
        label: HOSTLESS_PHASE_LABELS.verdict,
        durationSeconds: scaled(HOSTLESS_PHASE_SECONDS.verdict),
      });
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

interface HostlessAutopilotRunnerProps {
  gameId: string;
  game: GamePublicRecord;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

/**
 * Conduz a partida sem mestre: a cada tick decide o próximo passo e o executa uma vez.
 * Não renderiza nada; roda no computador da mesa.
 */
export function HostlessAutopilotRunner({ gameId, game, players }: HostlessAutopilotRunnerProps) {
  const timer = useSynchronizedTimer(game);
  const inFlightRef = useRef<string | null>(null);
  const step = decideHostlessStep(game, timer.status, (uid) => Boolean(players[uid]?.alive), timer.serverAdjustedNow);
  // Um passo por fase/estado: o tick repete a decisão, mas só a primeira execução vale.
  const stepKey = step
    ? `${game.phaseSessionId ?? ""}:${game.phase}:${game.verdictClosedAt ?? ""}:${step.kind}`
    : null;

  useEffect(() => {
    if (!step || !stepKey || inFlightRef.current === stepKey) return;
    if (step.kind === "start-timer" && !timer.serverOffsetAvailable) return;

    inFlightRef.current = stepKey;
    runStep(gameId, step, timer.serverTimeOffsetMs).catch((error: unknown) => {
      console.warn("[HostlessAutopilot] Passo falhou; tentando de novo.", { step, error });
      setTimeout(() => {
        if (inFlightRef.current === stepKey) inFlightRef.current = null;
      }, RETRY_DELAY_MS);
    });
  }, [gameId, step, stepKey, timer.serverOffsetAvailable, timer.serverTimeOffsetMs]);

  return null;
}
