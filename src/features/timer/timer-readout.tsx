import {
  formatTimerRemaining,
  type SynchronizedTimerState,
} from "./timer-state";

interface TimerReadoutProps {
  timer: SynchronizedTimerState;
}

const TIMER_STATUS_LABELS: Record<SynchronizedTimerState["status"], string> = {
  idle: "Timer não iniciado",
  running: "Tempo restante",
  paused: "Timer pausado",
  expired: "Tempo encerrado",
};

export function TimerReadout({ timer }: TimerReadoutProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-5 text-center">
      <p className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
        {TIMER_STATUS_LABELS[timer.status]}
      </p>
      <p
        aria-label={`${Math.ceil(timer.remainingMs / 1_000)} segundos restantes`}
        className={`mt-2 font-mono text-4xl font-bold tabular-nums ${
          timer.status === "expired" ? "text-[#f0b9bd]" : "text-[#fffaf0]"
        }`}
      >
        {timer.status === "idle"
          ? "--:--"
          : formatTimerRemaining(timer.remainingMs)}
      </p>
    </div>
  );
}
