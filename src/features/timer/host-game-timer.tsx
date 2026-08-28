"use client";

import { useRef, useState } from "react";

import type { GamePublicRecord } from "@/lib/firebase/schema";

import { getGameTimerControlErrorMessage } from "./control-game-timer";
import type { TimerCommand } from "./timer-controls";
import { TimerControlButtons } from "./timer-control-buttons";
import { parseTimerDurationSeconds } from "./timer-duration-mask";
import { TimerDurationInput } from "./timer-duration-input";
import { TimerPresetButtons } from "./timer-preset-buttons";
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
  const [durationDigits, setDurationDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [totalMs, setTotalMs] = useState<number | null>(() =>
    timer.remainingMs > 0 ? timer.remainingMs : null,
  );
  const parsedDurationSeconds = parseTimerDurationSeconds(durationDigits);
  const durationValid = parsedDurationSeconds !== null;
  const active = timer.status === "running" || timer.status === "paused";
  const controlsDisabled =
    busy || game.status !== "in-progress" || game.phase === "game-over";

  const runCommand = async (command: TimerCommand, success: string) => {
    if (commandInProgress.current) {
      return;
    }

    commandInProgress.current = true;
    setBusy(true);

    try {
      const { controlGameTimer } = await import("./control-game-timer");
      await controlGameTimer(gameId, command, timer.serverTimeOffsetMs);

      if (command.type === "start") {
        setTotalMs(command.durationMs);
        setDurationDigits("");
      } else if (command.type === "add-thirty-seconds") {
        setTotalMs((current) => (current ?? timer.remainingMs) + 30_000);
      } else if (command.type === "end") {
        setTotalMs(null);
      }
    } finally {
      commandInProgress.current = false;
      setBusy(false);
    }
  };

  const startTimer = (seconds: number) => {
    void runCommand(
      {
        type: "start",
        durationMs: seconds * 1_000,
      },
      "Timer iniciado.",
    );
  };

  const handleCustomStart = () => {
    if (parsedDurationSeconds !== null) {
      startTimer(parsedDurationSeconds);
    }
  };

  const handleDurationChange = (value: string) => {
    setDurationDigits(value);
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
        inactiveReadout={
          <TimerDurationInput
            value={durationDigits}
            valid={durationValid}
            disabled={controlsDisabled}
            onChange={handleDurationChange}
            onSubmit={handleCustomStart}
          />
        }
        controls={
          active ? (
            <TimerControlButtons
              status={timer.status}
              disabled={busy}
              onToggle={handleToggle}
              onStop={handleStop}
              onAddThirtySeconds={handleAddThirtySeconds}
            />
          ) : (
            <TimerPresetButtons
              disabled={controlsDisabled}
              onSelect={startTimer}
            />
          )
        }
      />
    </section>
  );
}
