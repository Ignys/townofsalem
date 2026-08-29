"use client";

import { getRoleById } from "@/data/roles";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import { GameTimerDisplay } from "@/features/timer/game-timer-display";
import type { GamePublicRecord, PublicPlayerRecord } from "@/lib/firebase/schema";

import { GAME_PHASE_LABELS } from "./game-phase-presentation";
import { PlayerRoleHoldButton } from "./player-role-hold-button";
import { PlayerRoleNotice } from "./player-role-notice";
import { PlayerStatusBoard } from "./player-status-board";
import { usePrivatePlayerRole } from "./use-private-player-role";

interface PlayerGameViewProps {
  gameId: string;
  code: string;
  game: GamePublicRecord;
  alive: boolean;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  viewerUid: string;
}

function formatPhase(game: GamePublicRecord): string {
  const label = game.phaseLabel ?? GAME_PHASE_LABELS[game.phase];
  if (game.phase === "night" && game.nightNumber) {
    return `${label} ${game.nightNumber}`;
  }
  if (game.phase !== "night" && game.day) {
    return `${label} ${game.day}`;
  }
  return label;
}

export function PlayerGameView({
  gameId,
  code,
  game,
  alive,
  players,
  viewerUid,
}: PlayerGameViewProps) {
  const privateRole = usePrivatePlayerRole(gameId);
  const gameVariants = useGameVariants(gameId);

  if (!privateRole.loaded || !gameVariants.loaded) {
    return <PlayerRoleNotice loading message="Carregando sua informação privada…" />;
  }

  if (privateRole.error || gameVariants.error) {
    return (
      <PlayerRoleNotice message="Não foi possível carregar sua role e as regras da partida com segurança. Tente novamente ou avise o mestre." />
    );
  }

  if (!privateRole.privatePlayer) {
    return (
      <PlayerRoleNotice
        loading
        message="Sua role ainda não está disponível. Aguarde o mestre concluir o sorteio."
      />
    );
  }

  const role = getRoleById(privateRole.privatePlayer.roleId);
  const playerCount = gameVariants.roleCount ?? Object.keys(players).length;

  if (!role || role.faction !== privateRole.privatePlayer.faction) {
    return (
      <PlayerRoleNotice message="Sua role não pôde ser reconhecida. Avise o mestre para revisar a partida." />
    );
  }

  const isNight = game.phase === "night";

  return (
    <div className="w-full max-w-md pb-24">
      <header className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#8f8a82] uppercase">
          Sala {code}
        </p>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            alive
              ? "border-[#6f9b77]/30 bg-[#6f9b77]/10 text-[#bfe0c5]"
              : "border-[#a33843]/30 bg-[#a33843]/10 text-[#f0b9bd]"
          }`}
        >
          {alive ? "Vivo" : "Morto"}
        </span>
      </header>

      <section
        className={`mt-4 rounded-3xl border p-6 text-center ${
          isNight
            ? "border-[#3b4a6b]/40 bg-[#151a26]"
            : "border-[#d3b88c]/25 bg-[#1f1c17]"
        }`}
      >
        <p className="text-xs font-bold tracking-[0.2em] text-[#9f9990] uppercase">
          Fase atual
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#fffaf0]">
          {formatPhase(game)}
        </h1>

        <div className="mt-5">
          {isNight ? (
            <p className="text-sm leading-6 text-[#a9b3cc]">
              A noite está em andamento. Aguarde o mestre chamar sua role.
            </p>
          ) : (
            <GameTimerDisplay game={game} />
          )}
        </div>
      </section>

      {game.status === "finished" && (
        <section className="mt-4 rounded-2xl border border-[#d3b88c]/30 bg-[#d3b88c]/10 p-4 text-center">
          <h2 className="font-serif text-xl font-semibold">Partida encerrada</h2>
          {game.winningFactions && game.winningFactions.length > 0 && (
            <p className="mt-2 text-sm text-[#e6cfa9]">
              Vencedores: {game.winningFactions.join(", ")}
            </p>
          )}
        </section>
      )}

      {!alive && (
        <p className="mt-4 rounded-xl border border-[#a33843]/30 bg-[#a33843]/10 px-4 py-3 text-center text-sm text-[#f0b9bd]">
          Você está morto, mas continua acompanhando a partida.
        </p>
      )}

      <div className="mt-4">
        <PlayerStatusBoard players={players} viewerUid={viewerUid} />
      </div>

      <PlayerRoleHoldButton
        role={role}
        variants={gameVariants.variants}
        playerCount={playerCount}
      />
    </div>
  );
}
