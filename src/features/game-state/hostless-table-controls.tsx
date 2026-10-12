"use client";

import { useState } from "react";

import { HostGameTimer } from "@/features/timer/host-game-timer";
import type { GamePublicRecord } from "@/lib/firebase/schema";

import { CurrentGamePhase } from "./current-game-phase";
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

  const handleEndGame = async () => {
    if (
      busy ||
      !window.confirm("Encerrar a partida? Todos os jogadores voltarão ao lobby para uma nova composição de roles.")
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
      {game.phase !== "game-over" && <HostGameTimer gameId={gameId} game={game} />}
      <p className="mt-4 text-xs leading-5 text-zinc-500">
        Partida sem mestre: as fases avançam sozinhas quando o timer acaba.
      </p>
      <div className="mt-4">
        <EndGameButton busy={busy} onClick={handleEndGame} />
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#f0b9bd]">
          Não foi possível encerrar a partida.
        </p>
      )}
    </section>
  );
}
