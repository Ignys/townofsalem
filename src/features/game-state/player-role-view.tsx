"use client";

import { getRoleById } from "@/data/roles";
import {
  FACTION_LABELS,
  formatRoleAlignment,
} from "@/features/roles/role-presentation";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import type { GamePublicRecord } from "@/lib/firebase/schema";

import { GamePhaseBanner } from "./game-phase-banner";
import { PlayerRoleGuide } from "./player-role-guide";
import { PlayerRoleNotice } from "./player-role-notice";
import { usePrivatePlayerRole } from "./use-private-player-role";

interface PlayerRoleViewProps {
  gameId: string;
  code: string;
  game: GamePublicRecord;
  alive: boolean;
  playerCount: number;
}

export function PlayerRoleView({
  gameId,
  code,
  game,
  alive,
  playerCount,
}: PlayerRoleViewProps) {
  const privateRole = usePrivatePlayerRole(gameId);
  const gameVariants = useGameVariants(gameId);

  if (!privateRole.loaded || !gameVariants.loaded) {
    return (
      <PlayerRoleNotice
        loading
        message="Carregando sua informação privada…"
      />
    );
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
  const gamePlayerCount = gameVariants.roleCount ?? playerCount;

  if (!role || role.faction !== privateRole.privatePlayer.faction) {
    return (
      <PlayerRoleNotice message="Sua role não pôde ser reconhecida. Avise o mestre para revisar a partida." />
    );
  }

  return (
    <article className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#1a1c1e] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-9">
      <header className="text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">
          Sala {code} · Sua role secreta
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#fffaf0] sm:text-5xl">
          {role.name}
        </h1>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <span className="rounded-full border border-[#d3b88c]/30 bg-[#d3b88c]/10 px-3 py-1 font-bold text-[#e6cfa9]">
            {FACTION_LABELS[role.faction]}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[#bdb7ad]">
            {formatRoleAlignment(role.alignment)}
          </span>
        </div>
      </header>

      <GamePhaseBanner game={game} />

      {game.status === "finished" && (
        <section className="mt-4 rounded-xl border border-[#d3b88c]/30 bg-[#d3b88c]/10 p-4 text-center">
          <h2 className="font-serif text-xl font-semibold">Partida encerrada</h2>
          {game.winningFactions && game.winningFactions.length > 0 && (
            <p className="mt-2 text-sm text-[#e6cfa9]">Vencedores: {game.winningFactions.join(", ")}</p>
          )}
        </section>
      )}

      <p
        className={`mt-4 rounded-xl px-4 py-3 text-center text-sm font-bold ${
          alive
            ? "border border-[#6f9b77]/30 bg-[#6f9b77]/10 text-[#bfe0c5]"
            : "border border-[#a33843]/30 bg-[#a33843]/10 text-[#f0b9bd]"
        }`}
      >
        {alive
          ? "Você está vivo na partida."
          : "Você está morto, mas continua conectado e pode consultar sua role."}
      </p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/15 p-5">
        <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
          Seu objetivo
        </h2>
        <p className="mt-2 leading-7 text-[#e5ded2]">{role.goal}</p>
      </section>

      <PlayerRoleGuide
        role={role}
        variants={gameVariants.variants}
        playerCount={gamePlayerCount}
      />

      <p className="mt-6 text-center text-xs leading-5 text-[#8f8a82]">
        Esta informação é privada. Não mostre sua tela aos outros jogadores.
      </p>
    </article>
  );
}
