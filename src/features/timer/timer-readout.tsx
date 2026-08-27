import type { ReactNode } from "react";

import {
  formatTimerRemaining,
  type SynchronizedTimerState,
} from "./timer-state";
import { TimerProgressBar } from "./timer-progress-bar";

interface TimerReadoutProps {
  timer: SynchronizedTimerState;
  totalMs?: number | null;
  controls?: ReactNode;
}

const TIMER_STATUS_LABELS: Record<SynchronizedTimerState["status"], string> = {
  idle: "Timer não iniciado",
  running: "Tempo restante",
  paused: "Timer pausado",
  expired: "Tempo encerrado",
};

const CRITICAL_THRESHOLD_MS = 10_000;

export function TimerReadout({
  timer,
  totalMs = null,
  controls,
}: TimerReadoutProps) {
  const progress =
    totalMs && totalMs > 0
      ? Math.min(1, Math.max(0, timer.remainingMs / totalMs))
      : 0;
  const isCritical =
    timer.status === "running" &&
    timer.remainingMs <= CRITICAL_THRESHOLD_MS;

  return (
    <div>
      <div className="flex w-full items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
            {TIMER_STATUS_LABELS[timer.status]}
          </p>

          <p
            aria-label={`${Math.ceil(timer.remainingMs / 1_000)} segundos restantes`}
            className={`mt-1 font-mono text-5xl font-bold tabular-nums transition-colors duration-300 ${
              timer.status === "expired"
                ? "text-[#f0b9bd]"
                : isCritical
                  ? "animate-pulse text-[#f0b9bd]"
                  : "text-[#fffaf0]"
            }`}
          >
            {timer.status === "idle"
              ? "--:--"
              : formatTimerRemaining(timer.remainingMs)}
          </p>
        </div>

        {controls}
      </div>

      <TimerProgressBar
        progress={progress}
        critical={isCritical}
        expired={timer.status === "expired"}
      />
    </div>
  );
}
