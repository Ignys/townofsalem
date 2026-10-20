"use client";

import { useRef, useState } from "react";

import { HostGameTimer } from "@/features/timer/host-game-timer";
import type { GamePublicRecord } from "@/lib/firebase/schema";

import { CurrentGamePhase } from "./current-game-phase";
import { EndGameButton } from "./end-game-button";
import { PhaseChangeConfirmationDialog } from "./phase-change-confirmation-dialog";
import { getNightEndLabel, shouldConfirmNightEnd } from "./phase-end-label";
import { PHASE_DEFINITIONS } from "./phase-definitions";
import { PhaseSky } from "./phase-sky";

interface HostGameControlPanelProps {
  gameId: string;
  game: GamePublicRecord;
}

interface PhaseFeedback {
  kind: "error" | "success";
  message: string;
}

interface PhaseStartInput {
  phaseId: (typeof PHASE_DEFINITIONS)[number]["id"] | "custom";
  label: string;
  durationSeconds: number | null;
}

export function HostGameControlPanel({ gameId, game }: HostGameControlPanelProps) {
  const commandInProgress = useRef(false);
  const [busy, setBusy] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customMinutes, setCustomMinutes] = useState("1");
  const [customSeconds, setCustomSeconds] = useState("0");
  const [feedback, setFeedback] = useState<PhaseFeedback | null>(null);
  const [pendingPhase, setPendingPhase] = useState<PhaseStartInput | null>(null);

  const startPhase = async (input: PhaseStartInput): Promise<boolean> => {
    if (commandInProgress.current) return false;

    commandInProgress.current = true;
    setBusy(true);
    setFeedback(null);

    try {
      // Sair da noite aplica o resultado antes, para mortes e anúncios chegarem ao dia.
      if (game.phase === "night" && input.phaseId !== "night") {
        const { applyNightBeforeLeaving } = await import("@/features/night-actions/night-apply-registry");
        const outcome = await applyNightBeforeLeaving(gameId);
        if (outcome.kind === "blocked") {
          setFeedback({ kind: "error", message: outcome.reason });
          return false;
        }
      }

      const { startHostPhase } = await import("./start-host-phase");
      await startHostPhase(gameId, input);
      setFeedback({ kind: "success", message: `${input.label} iniciada.` });
      setCustomOpen(false);
      return true;
    } catch {
      setFeedback({
        kind: "error",
        message: "Não foi possível iniciar a fase. Revise a duração e tente novamente.",
      });
      return false;
    } finally {
      commandInProgress.current = false;
      setBusy(false);
    }
  };

  const selectPhase = (input: PhaseStartInput) => {
    if (shouldConfirmNightEnd(game.phase)) {
      setFeedback(null);
      setPendingPhase(input);
      return;
    }

    void startPhase(input);
  };

  const confirmPhaseChange = async () => {
    if (!pendingPhase) return;

    if (await startPhase(pendingPhase)) {
      setPendingPhase(null);
    }
  };

  const customDurationSeconds = Number(customMinutes) * 60 + Number(customSeconds);
  const customDurationValid =
    Number.isInteger(customDurationSeconds) &&
    customDurationSeconds > 0 &&
    customDurationSeconds <= 86_400;

  const handleEndGame = async () => {
    if (
      busy ||
      !window.confirm(
        game.status === "finished"
          ? "Voltar todos ao lobby para uma nova partida?"
          : "Encerrar a partida? Todos verão o resultado e as roles de cada um.",
      )
    ) {
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const { endGame } = await import("./end-game");
      await endGame(gameId);
      setFeedback({
        kind: "success",
        message: game.status === "finished" ? "Retornando todos ao lobby." : "Partida encerrada.",
      });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível encerrar a partida." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PhaseSky night={game.phase === "night"} className="p-5">
      <CurrentGamePhase game={game} />
      {game.phase !== "game-over" && (
        <HostGameTimer gameId={gameId} game={game} />
      )}
      <div className="mt-5">
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2"
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
                  selectPhase({
                    phaseId: definition.id,
                    label: definition.label,
                    durationSeconds: definition.defaultDurationSeconds,
                  })
                }
                disabled={busy || game.status !== "in-progress"}
                className="choice-dark min-h-11 px-3 py-2 text-center text-sm"
              >
                {definition.label}
              </button>
            );
          })}
        </div>
      </div>

      {game.status === "in-progress" && (
        <EndGameButton busy={busy} onClick={() => void handleEndGame()} />
      )}
      {game.status === "finished" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleEndGame()}
          className="btn-primary mt-4 w-full"
        >
          Nova partida
        </button>
      )}

      <PhaseChangeConfirmationDialog
        open={pendingPhase !== null}
        endingPhaseLabel={getNightEndLabel(game)}
        busy={busy}
        errorMessage={feedback?.kind === "error" ? feedback.message : undefined}
        onCancel={() => setPendingPhase(null)}
        onConfirm={() => void confirmPhaseChange()}
      />
    </PhaseSky>
  );
}
