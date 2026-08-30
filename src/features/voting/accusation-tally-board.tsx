"use client";

import type { PublicPlayerRecord } from "@/lib/firebase/schema";

import { getAccusationVotesRequired } from "./accusation-threshold";
import { usePublicAccusations } from "./use-public-accusations";

interface AccusationTallyBoardProps {
  gameId: string;
  dayNumber: number;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

/**
 * Placar ao vivo das acusações.
 *
 * Conta apenas votos brutos: pesos (prefeito revelado) e exclusões (blackmail) dependem
 * de dados privados que o jogador não pode ler. Quem decide o limiar de verdade é o host.
 */
export function AccusationTallyBoard({ gameId, dayNumber, players }: AccusationTallyBoardProps) {
  const { accusations, loaded, error } = usePublicAccusations(gameId, dayNumber);
  const votesRequired = getAccusationVotesRequired(players);

  const tallies = Object.entries(accusations)
    .filter(([voterUid, targetUid]) => players[voterUid]?.alive && players[targetUid]?.alive)
    .reduce<Record<string, number>>((counts, [, targetUid]) => {
      counts[targetUid] = (counts[targetUid] ?? 0) + 1;
      return counts;
    }, {});

  const rows = Object.entries(tallies).sort(
    ([leftUid, left], [rightUid, right]) =>
      right - left ||
      (players[leftUid]?.name ?? "").localeCompare(players[rightUid]?.name ?? "", "pt-BR"),
  );

  return (
    <section className="mt-4 rounded-2xl border border-[#d3b88c]/25 bg-black/20 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold text-[#fffaf0]">Votos</h2>
        <span className="text-xs font-bold text-[#9f9990]">
          {votesRequired} para julgar
        </span>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
          Não foi possível carregar o placar.
        </p>
      ) : !loaded ? (
        <p className="mt-2 text-sm text-[#9f9990]">Carregando votos…</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-sm text-[#9f9990]">Ninguém foi acusado ainda.</p>
      ) : (
        <ul className="mt-2 grid gap-1">
          {rows.map(([targetUid, votes]) => (
            <li key={targetUid} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-[#e5ded2]">{players[targetUid]?.name}</span>
              <span
                className={`shrink-0 font-bold ${
                  votes >= votesRequired ? "text-[#f0b9bd]" : "text-[#bdb7ad]"
                }`}
              >
                {votes}/{votesRequired}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
