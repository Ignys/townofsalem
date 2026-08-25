"use client";

import { useState } from "react";

import { getPlayerEntries } from "@/features/game-state/player-roster";
import { isPlayerEligibleToVote } from "@/game-engine/player-eligibility";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";

import { usePlayerAccusationVote } from "./use-player-accusation-vote";
import { saveAccusationVote } from "./voting-repository";

interface PlayerAccusationVotingProps {
  gameId: string;
  dayNumber: number;
  playerAlive: boolean;
  players: Record<string, PublicPlayerRecord>;
}

export function PlayerAccusationVoting({
  gameId,
  dayNumber,
  playerAlive,
  players,
}: PlayerAccusationVotingProps) {
  const currentVote = usePlayerAccusationVote(gameId, dayNumber);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const targets = getPlayerEntries(players).filter(([, player]) => player.alive);

  const handleVote = async (targetUid: string | null) => {
    setBusy(true);
    setFeedback(null);
    try {
      await saveAccusationVote(gameId, dayNumber, targetUid);
    } catch {
      setFeedback("Não foi possível registrar sua acusação.");
    } finally {
      setBusy(false);
    }
  };

  if (!isPlayerEligibleToVote({ alive: playerAlive })) {
    return <VotingNotice>Jogadores mortos não podem acusar.</VotingNotice>;
  }

  return (
    <section className="mt-5 rounded-2xl border border-[#d3b88c]/25 bg-black/20 p-4 sm:p-5">
      <h2 className="font-serif text-xl font-semibold text-[#fffaf0]">
        Votação de acusação
      </h2>
      <p className="mt-1 text-sm text-[#bdb7ad]">
        Escolha um jogador vivo. Você pode trocar ou remover seu voto.
      </p>

      {!currentVote.loaded ? (
        <p className="mt-4 text-sm text-[#9f9990]">Carregando seu voto…</p>
      ) : currentVote.error ? (
        <p role="alert" className="mt-4 text-sm text-[#f0b9bd]">
          Não foi possível carregar seu voto.
        </p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {targets.map(([targetUid, target]) => {
            const selected = currentVote.vote === targetUid;
            return (
              <button
                key={targetUid}
                type="button"
                disabled={busy}
                onClick={() => void handleVote(targetUid)}
                className={`min-h-12 rounded-xl border px-4 py-3 text-left font-bold disabled:opacity-50 ${
                  selected
                    ? "border-[#d3b88c] bg-[#d3b88c]/20 text-[#fffaf0]"
                    : "border-white/10 bg-white/5 text-[#e5ded2]"
                }`}
              >
                {target.name}{selected ? " · selecionado" : ""}
              </button>
            );
          })}
        </div>
      )}

      {currentVote.vote && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleVote(null)}
          className="mt-3 min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-[#bdb7ad] disabled:opacity-50"
        >
          Remover acusação
        </button>
      )}
      <p role="alert" className="mt-2 min-h-5 text-sm text-[#f0b9bd]">
        {feedback ?? ""}
      </p>
    </section>
  );
}

function VotingNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#bdb7ad]">
      {children}
    </p>
  );
}
