"use client";

import { useRef, useState } from "react";

import type { GamePublicRecord } from "@/lib/firebase/schema";

import { getGameTimerControlErrorMessage } from "./control-game-timer";
import type { TimerCommand } from "./timer-controls";
import { TimerControlButtons } from "./timer-control-buttons";
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
  const [totalMs, setTotalMs] = useState<number | null>(() =>
    timer.remainingMs > 0 ? timer.remainingMs : null,
  );
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

      if (command.type === "start") {
        setTotalMs(command.durationMs);
      } else if (command.type === "add-thirty-seconds") {
        setTotalMs((current) => (current ?? timer.remainingMs) + 30_000);
      } else if (command.type === "end") {
        setTotalMs(null);
      }

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

  const handleStart = () => {
    void runCommand(
      {
        type: "start",
        durationMs: parsedDurationSeconds * 1_000,
      },
      "Timer iniciado.",
    );
  };

  const handleToggle = () => {
    const command: TimerCommand =
      timer.status === "running" ? { type: "pause" } : { type: "resume" };

    void runCommand(
      command,
      timer.status === "running" ? "Timer pausado." : "Timer retomado.",
    );
  };

  const handleStop = () => {
    void runCommand({ type: "end" }, "Timer encerrado.");
  };

  const handleAddThirtySeconds = () => {
    void runCommand(
      { type: "add-thirty-seconds" },
      "Foram adicionados 30 segundos.",
    );
  };

  return (
    <section className="mt-4 border-t border-white/10 pt-4">
      <TimerReadout
        timer={timer}
        totalMs={totalMs}
        controls={
          active ? (
            <TimerControlButtons
              status={timer.status}
              disabled={busy}
              onToggle={handleToggle}
              onStop={handleStop}
              onAddThirtySeconds={handleAddThirtySeconds}
            />
          ) : null
        }
      />
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
            onClick={handleStart}
            disabled={busy || !durationValid || game.phase === "game-over"}
            className="min-h-11 self-end rounded-xl bg-[#7d2330] px-5 py-2 font-bold text-white hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:bg-[#5d5552]"
          >
            Iniciar timer
          </button>
        </div>
      )}
    </section>
  );
}
