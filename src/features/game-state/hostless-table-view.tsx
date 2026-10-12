"use client";

import type { ReactNode } from "react";

import { useGameVariants } from "@/features/game-variants/use-game-variants";
import { HostDayAnnouncements } from "@/features/night-actions/host-day-announcements";
import { AccusationTallyBoard } from "@/features/voting/accusation-tally-board";
import { VerdictVotesBoard } from "@/features/voting/verdict-votes-board";
import { isAccusationPhase } from "@/features/voting/voting-phases";
import type { GamePublicRecord, PublicPlayerRecord } from "@/lib/firebase/schema";

import { GameOverCard } from "./game-over-card";
import { PlayerStatusBoard } from "./player-status-board";
import { RemainingRolesBoard } from "./remaining-roles-board";
import { useGraveyard } from "./use-graveyard";
import { useMayorReveals } from "./use-mayor-reveals";

interface HostlessTableViewProps {
  gameId: string;
  game: GamePublicRecord;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  /** Controles não intrusivos (fase, timer, encerrar). */
  controls: ReactNode;
  /** Motor da partida: montado mas invisível, nunca mostra roles nem ações. */
  engine: ReactNode;
}

/**
 * Mesa do modo sem mestre: só o que todo mundo na mesa pode ver. Roles, ações e resultados
 * privados ficam fora da tela; o motor roda escondido no mesmo tab.
 */
export function HostlessTableView({ gameId, game, players, controls, engine }: HostlessTableViewProps) {
  const { graveyard } = useGraveyard(gameId);
  const mayorReveals = useMayorReveals(gameId);
  const gameVariants = useGameVariants(gameId);
  const isNight = game.phase === "night";

  return (
    <div className="grid min-w-0 items-start gap-5 p-1 pr-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.7fr)]">
      <div className="space-y-4">
        <GameOverCard game={game} players={players} />
        {isNight ? (
          <section className="rounded-3xl border border-[#3b4a6b]/40 bg-[#151a26] p-6 text-center">
            <p className="font-serif text-2xl font-semibold text-[#fffaf0]">A cidade dorme.</p>
            <p className="mt-2 text-sm text-[#a9b3cc]">
              Cada jogador faz sua ação no próprio celular. O resultado sai quando a noite acabar.
            </p>
          </section>
        ) : (
          <HostDayAnnouncements gameId={gameId} />
        )}
        {isAccusationPhase(game.phase) && !game.accusedPlayerUid && (
          <AccusationTallyBoard gameId={gameId} dayNumber={game.day} players={players} />
        )}
        {game.phase === "verdict" && (
          <VerdictVotesBoard
            gameId={gameId}
            dayNumber={game.day}
            players={players}
            accusedUid={game.accusedPlayerUid}
            closed={Boolean(game.verdictClosedAt)}
          />
        )}
        <PlayerStatusBoard players={players} viewerUid="" graveyard={graveyard} mayorReveals={mayorReveals} />
        <RemainingRolesBoard roleComposition={gameVariants.roleComposition} graveyard={graveyard} />
        <div hidden aria-hidden="true">
          {engine}
        </div>
      </div>
      {controls}
    </div>
  );
}
