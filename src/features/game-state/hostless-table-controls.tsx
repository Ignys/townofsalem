"use client";

import { useState } from "react";

import { HostGameTimer } from "@/features/timer/host-game-timer";
import type { GamePublicRecord } from "@/lib/firebase/schema";

import { CurrentGamePhase } from "./current-game-phase";
import { GAME_PACE_LABELS, HOSTLESS_PACE_SECONDS } from "./hostless-autopilot";
import { getPhaseDefinition } from "./phase-definitions";
import { EndGameButton } from "./end-game-button";

interface HostlessTableControlsProps {
  gameId: string;
  game: GamePublicRecord;
}

/**
 * O que a mesa pode fazer no modo sem mestre: só ajustes que não decidem nada do jogo
 * (dar mais tempo, pausar) e encerrar a partida. As fases avançam sozinhas.
 */
export function HostlessTableControls({ gameId, game }: HostlessTableControlsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  // Alguém sem conseguir apertar "Pronto" (celular sem bateria, saiu da mesa) não trava o dia.
  const handleSkipDawn = async () => {
    if (busy || !window.confirm("Pular a preparação e começar a discussão agora?")) return;
    setBusy(true);
    setError(false);
    try {
      const { startHostPhase } = await import("./start-host-phase");
      await startHostPhase(gameId, {
        phaseId: "discussion",
        label: getPhaseDefinition("discussion").label,
        durationSeconds: HOSTLESS_PACE_SECONDS[game.gamePace ?? "relaxed"].discussion ?? null,
      });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const handleEndGame = async () => {
    if (
      busy ||
      (game.status !== "finished" &&
        !window.confirm("Encerrar a partida? Todos verão o resultado e as roles de cada um. Depois, use Nova partida para voltar ao lobby."))
    ) {
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const { endGame } = await import("./end-game");
      await endGame(gameId);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="items-center rounded-2xl border border-[#d3b88c]/20 bg-black/20 px-5 py-4 sm:min-w-80">
      <CurrentGamePhase game={game} />
      {game.phase === "day" ? (
        <button
          type="button"
          disabled={busy}
          onClick={handleSkipDawn}
          className="mt-3 min-h-11 w-full rounded-xl border border-[#f2c879]/40 bg-[#f2c879]/10 px-4 text-sm font-bold text-[#fffaf0] disabled:opacity-50"
        >
          Pular preparação
        </button>
      ) : (
        game.phase !== "game-over" && <HostGameTimer gameId={gameId} game={game} />
      )}
      <p className="mt-4 text-xs leading-5 text-zinc-500">
        Partida sem mestre · ritmo {GAME_PACE_LABELS[game.gamePace ?? "relaxed"].title}: as fases avançam sozinhas.
      </p>
      <div className="mt-4">
        {game.status === "finished" ? (
          <button
            type="button"
            disabled={busy}
            onClick={handleEndGame}
            className="min-h-11 w-full rounded-xl border border-[#d3b88c]/40 bg-[#d3b88c]/15 px-4 text-sm font-bold text-[#fffaf0] disabled:opacity-50"
          >
            Nova partida
          </button>
        ) : (
          <EndGameButton busy={busy} onClick={handleEndGame} />
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#f0b9bd]">
          Não foi possível concluir a ação. Tente de novo.
        </p>
      )}
    </section>
  );
}
