"use client";

import { useRef, useState } from "react";

import { HostGameTimer } from "@/features/timer/host-game-timer";
import type { GamePublicRecord } from "@/lib/firebase/schema";

import { GAME_PHASE_LABELS } from "./game-phase-presentation";
import { PHASE_DEFINITIONS } from "./phase-definitions";

interface HostGameControlPanelProps {
  gameId: string;
  game: GamePublicRecord;
}

interface PhaseFeedback {
  kind: "error" | "success";
  message: string;
}

export function HostGameControlPanel({ gameId, game }: HostGameControlPanelProps) {
  const commandInProgress = useRef(false);
  const [busy, setBusy] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customMinutes, setCustomMinutes] = useState("1");
  const [customSeconds, setCustomSeconds] = useState("0");
  const [feedback, setFeedback] = useState<PhaseFeedback | null>(null);

  const startPhase = async (input: {
    phaseId: (typeof PHASE_DEFINITIONS)[number]["id"] | "custom";
    label: string;
    durationSeconds: number | null;
  }) => {
    if (commandInProgress.current) return;

    commandInProgress.current = true;
    setBusy(true);
    setFeedback(null);

    try {
      const { startHostPhase } = await import("./start-host-phase");
      await startHostPhase(gameId, input);
      setFeedback({ kind: "success", message: `${input.label} iniciada.` });
      setCustomOpen(false);
    } catch {
      setFeedback({
        kind: "error",
        message: "Não foi possível iniciar a fase. Revise a duração e tente novamente.",
      });
    } finally {
      commandInProgress.current = false;
      setBusy(false);
    }
  };

  const customDurationSeconds = Number(customMinutes) * 60 + Number(customSeconds);
  const customDurationValid =
    Number.isInteger(customDurationSeconds) &&
    customDurationSeconds > 0 &&
    customDurationSeconds <= 86_400;

  const handleEndGame = async () => {
    if (busy || !window.confirm("Encerrar a partida? Logs e histórico continuarão disponíveis.")) return;
    setBusy(true);
    setFeedback(null);
    try {
      const { endGame } = await import("./end-game");
      await endGame(gameId);
      setFeedback({ kind: "success", message: "Partida encerrada pelo mestre." });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível encerrar a partida." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-[#1a1c1e] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">
            Controle da partida
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-[#fffaf0]">
            {game.phaseLabel ?? GAME_PHASE_LABELS[game.phase]}
            {game.phase === "night" && game.nightNumber ? ` ${game.nightNumber}` : ""}
          </h2>
        </div>
        <span className="rounded-full border border-[#d3b88c]/25 bg-[#d3b88c]/10 px-3 py-1 text-xs font-bold text-[#e6cfa9]">
          Fase atual
        </span>
      </header>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-[#e5ded2]">Iniciar qualquer fase</h3>
        <div
          className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7"
          aria-label="Fases disponíveis"
        >
          {PHASE_DEFINITIONS.map((definition) => {
            const current = game.phase === definition.id;

            return (
              <button
                key={definition.id}
                type="button"
                aria-pressed={current}
                onClick={() =>
                  void startPhase({
                    phaseId: definition.id,
                    label: definition.label,
                    durationSeconds: definition.defaultDurationSeconds,
                  })
                }
                disabled={busy || game.status !== "in-progress"}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:opacity-50 ${
                  current
                    ? "border-[#d3b88c] bg-[#d3b88c]/20 text-[#fffaf0]"
                    : "border-white/15 bg-white/8 text-[#e5ded2] hover:bg-white/12"
                }`}
              >
                {definition.label}
              </button>
            );
          })}
          <button
            type="button"
            aria-expanded={customOpen}
            onClick={() => setCustomOpen((open) => !open)}
            disabled={busy || game.status !== "in-progress"}
            className="min-h-11 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-sm font-bold text-[#e5ded2] hover:bg-white/12 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-50"
          >
            Personalizado
          </button>
        </div>
      </div>

      {customOpen && (
        <form
          className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 sm:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (customDurationValid) {
              void startPhase({
                phaseId: "custom",
                label: customLabel.trim() || "Fase personalizada",
                durationSeconds: customDurationSeconds,
              });
            }
          }}
        >
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
            Nome opcional
            <input
              value={customLabel}
              maxLength={40}
              onChange={(event) => setCustomLabel(event.target.value)}
              className="min-h-11 rounded-xl border border-white/15 bg-black/20 px-3 text-[#fffaf0] focus:border-[#d3b88c] focus:outline-none"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Minutos
            <input
              type="number"
              min={0}
              max={1440}
              value={customMinutes}
              onChange={(event) => setCustomMinutes(event.target.value)}
              className="min-h-11 rounded-xl border border-white/15 bg-black/20 px-3 text-[#fffaf0] focus:border-[#d3b88c] focus:outline-none"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Segundos
            <input
              type="number"
              min={0}
              max={59}
              value={customSeconds}
              onChange={(event) => setCustomSeconds(event.target.value)}
              className="min-h-11 rounded-xl border border-white/15 bg-black/20 px-3 text-[#fffaf0] focus:border-[#d3b88c] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !customDurationValid}
            className="min-h-11 rounded-xl bg-[#7d2330] px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#5d5552] sm:col-span-4"
          >
            Iniciar fase personalizada
          </button>
        </form>
      )}

      <p
        role={feedback?.kind === "error" ? "alert" : "status"}
        className={`mt-3 min-h-5 text-sm ${
          feedback?.kind === "error" ? "text-[#f0b9bd]" : "text-[#bfe0c5]"
        }`}
      >
        {feedback?.message ?? ""}
      </p>

      {game.phase !== "game-over" && <HostGameTimer gameId={gameId} game={game} />}
      {game.status === "in-progress" && (
        <button type="button" disabled={busy} onClick={() => void handleEndGame()} className="mt-5 min-h-10 rounded-xl border border-[#a33843]/35 px-3 text-sm font-bold text-[#f0b9bd] disabled:opacity-50">
          Encerrar partida
        </button>
      )}
    </section>
  );
}
