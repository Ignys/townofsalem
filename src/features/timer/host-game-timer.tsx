"use client";

import { useRef, useState } from "react";

import type { GamePublicRecord } from "@/lib/firebase/schema";

import { getGameTimerControlErrorMessage } from "./control-game-timer";
import type { TimerCommand } from "./timer-controls";
import { TimerReadout } from "./timer-readout";
import { useSynchronizedTimer } from "./use-synchronized-timer";

interface HostGameTimerProps {
  gameId: string;
  game: GamePublicRecord;
}

interface TimerFeedback {
  kind: "error" | "success";
  message: string;
}

export function HostGameTimer({ gameId, game }: HostGameTimerProps) {
  const timer = useSynchronizedTimer(game);
  const commandInProgress = useRef(false);
  const [durationSeconds, setDurationSeconds] = useState("60");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<TimerFeedback | null>(null);
  const parsedDurationSeconds = Number(durationSeconds);
  const durationValid =
    Number.isFinite(parsedDurationSeconds) &&
    parsedDurationSeconds >= 1;
  const active = timer.status === "running" || timer.status === "paused";

  const runCommand = async (command: TimerCommand, success: string) => {
    if (commandInProgress.current) {
      return;
    }

    commandInProgress.current = true;
    setBusy(true);
    setFeedback(null);

    try {
      const { controlGameTimer } = await import("./control-game-timer");
      await controlGameTimer(gameId, command, timer.serverTimeOffsetMs);
      setFeedback({ kind: "success", message: success });
    } catch (error: unknown) {
      setFeedback({
        kind: "error",
        message: getGameTimerControlErrorMessage(error),
      });
    } finally {
      commandInProgress.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 border-t border-white/10 pt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-semibold text-[#fffaf0]">Timer da fase</h3>
        <span className="text-xs text-[#8f8a82]">
          {timer.serverOffsetAvailable
            ? "Relógio sincronizado"
            : "Usando relógio local"}
        </span>
      </div>

      <TimerReadout timer={timer} />

      {(timer.status === "idle" || timer.status === "expired") && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="grid gap-1.5 text-sm font-semibold text-[#e5ded2]">
            Duração em segundos
            <input
              type="number"
              min={1}
              step={1}
              value={durationSeconds}
              onChange={(event) => setDurationSeconds(event.target.value)}
              disabled={busy}
              className="min-h-11 rounded-xl border border-white/15 bg-black/20 px-3 text-[#fffaf0] outline-none focus:border-[#d3b88c] focus:ring-3 focus:ring-[#d3b88c]/15 disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              void runCommand(
                {
                  type: "start",
                  durationMs: parsedDurationSeconds * 1_000,
                },
                "Timer iniciado.",
              )
            }
            disabled={busy || !durationValid || game.phase === "game-over"}
            className="min-h-11 self-end rounded-xl bg-[#7d2330] px-5 py-2 font-bold text-white hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:bg-[#5d5552]"
          >
            Iniciar timer
          </button>
        </div>
      )}

      {active && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              void runCommand(
                timer.status === "running"
                  ? { type: "pause" }
                  : { type: "resume" },
                timer.status === "running"
                  ? "Timer pausado."
                  : "Timer retomado.",
              )
            }
            disabled={busy}
            className="min-h-11 rounded-xl border border-white/15 bg-white/8 px-3 py-2 font-bold text-[#fffaf0] hover:bg-white/12 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-50"
          >
            {timer.status === "running" ? "Pausar" : "Retomar"}
          </button>
          <button
            type="button"
            onClick={() =>
              void runCommand(
                { type: "add-thirty-seconds" },
                "Foram adicionados 30 segundos.",
              )
            }
            disabled={busy}
            className="min-h-11 rounded-xl border border-white/15 bg-white/8 px-3 py-2 font-bold text-[#fffaf0] hover:bg-white/12 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-50"
          >
            +30 segundos
          </button>
          <button
            type="button"
            onClick={() =>
              void runCommand({ type: "end" }, "Timer encerrado.")
            }
            disabled={busy}
            className="col-span-2 min-h-11 rounded-xl border border-[#a33843]/35 bg-[#a33843]/10 px-3 py-2 font-bold text-[#f0b9bd] hover:bg-[#a33843]/20 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-50 sm:col-span-1"
          >
            Encerrar
          </button>
        </div>
      )}

      <p
        role={feedback?.kind === "error" ? "alert" : "status"}
        className={`mt-3 min-h-5 text-sm ${
          feedback?.kind === "error"
            ? "text-[#f0b9bd]"
            : "text-[#bfe0c5]"
        }`}
      >
        {feedback?.message ?? ""}
      </p>
    </section>
  );
}
