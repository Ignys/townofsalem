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

  // Quem acusou quem: a acusação é pública, então todos veem os nomes.
  const votersByTarget = Object.entries(accusations)
    .filter(([voterUid, targetUid]) => players[voterUid]?.alive && players[targetUid]?.alive)
    .reduce<Record<string, string[]>>((voters, [voterUid, targetUid]) => {
      (voters[targetUid] ??= []).push(players[voterUid]?.name ?? "?");
      return voters;
    }, {});

  const rows = Object.entries(votersByTarget).sort(
    ([leftUid, left], [rightUid, right]) =>
      right.length - left.length ||
      (players[leftUid]?.name ?? "").localeCompare(players[rightUid]?.name ?? "", "pt-BR"),
  );

  return (
    <section className="panel-public">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold">Votos da cidade</h2>
        <span className="text-xs font-bold text-[#75685f]">
          Julgamento com {votesRequired} votos
        </span>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-[#7d2330]">
          Não foi possível carregar o placar.
        </p>
      ) : !loaded ? (
        <p className="mt-2 text-sm text-[#75685f]">Carregando votos…</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-sm text-[#75685f]">Ninguém foi acusado ainda.</p>
      ) : (
        <ul className="mt-2 divide-y divide-[#d8c8b0]">
          {rows.map(([targetUid, voters]) => (
            <li key={targetUid} className="py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-semibold">{players[targetUid]?.name}</span>
                <span
                  className={`shrink-0 font-bold ${
                    voters.length >= votesRequired ? "text-[#7d2330]" : "text-[#5b4d44]"
                  }`}
                >
                  {voters.length}/{votesRequired}
                </span>
              </div>
              <p className="text-xs text-[#75685f]">
                {voters.sort((left, right) => left.localeCompare(right, "pt-BR")).join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
