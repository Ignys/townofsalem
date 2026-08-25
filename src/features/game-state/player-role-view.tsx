"use client";

import { getRoleById } from "@/data/roles";
import {
  FACTION_LABELS,
  formatRoleAlignment,
} from "@/features/roles/role-presentation";
import type { PlayerExperience } from "@/types";
import type { GamePublicRecord } from "@/lib/firebase/schema";

import { GamePhaseBanner } from "./game-phase-banner";
import { PlayerRoleNotice } from "./player-role-notice";
import { usePrivatePlayerRole } from "./use-private-player-role";

interface PlayerRoleViewProps {
  gameId: string;
  code: string;
  experience: PlayerExperience;
  game: GamePublicRecord;
  alive: boolean;
}

export function PlayerRoleView({
  gameId,
  code,
  experience,
  game,
  alive,
}: PlayerRoleViewProps) {
  const privateRole = usePrivatePlayerRole(gameId);

  if (!privateRole.loaded) {
    return (
      <PlayerRoleNotice
        loading
        message="Carregando sua informação privada…"
      />
    );
  }

  if (privateRole.error) {
    return (
      <PlayerRoleNotice message="Não foi possível carregar sua role com segurança. Tente novamente ou avise o mestre." />
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

  if (!role || role.faction !== privateRole.privatePlayer.faction) {
    return (
      <PlayerRoleNotice message="Sua role não pôde ser reconhecida. Avise o mestre para revisar a partida." />
    );
  }

  const showBeginnerExplanation =
    experience === "beginner" && Boolean(role.beginnerDescription);

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

      <details className="group mt-5 rounded-2xl border border-[#d3b88c]/25 bg-[#d3b88c]/8 open:pb-5">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 font-bold text-[#fffaf0] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c]">
          <span>Como jogar esta role</span>
          <span
            aria-hidden="true"
            className="text-[#d3b88c] transition group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <div className="border-t border-[#d3b88c]/15 px-5 pt-5">
          <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
            Descrição
          </h2>
          <p className="mt-2 leading-7 text-[#e5ded2]">{role.description}</p>

          {showBeginnerExplanation && (
            <div className="mt-5 border-t border-[#d3b88c]/15 pt-5">
              <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
                Explicação para iniciante
              </h2>
              <p className="mt-2 leading-7 text-[#e5ded2]">
                {role.beginnerDescription}
              </p>
            </div>
          )}
          {role.importantInteractions.length > 0 && (
            <div className="mt-5 border-t border-[#d3b88c]/15 pt-5">
              <h2 className="text-sm font-bold tracking-wide text-[#e6cfa9] uppercase">
                Interações importantes
              </h2>
              <ul className="mt-2 list-disc space-y-2 pl-5 leading-7 text-[#e5ded2]">
                {role.importantInteractions.map((interaction) => (
                  <li key={interaction}>{interaction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>

      <p className="mt-6 text-center text-xs leading-5 text-[#8f8a82]">
        Esta informação é privada. Não mostre sua tela aos outros jogadores.
      </p>
    </article>
  );
}
