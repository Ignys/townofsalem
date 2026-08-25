"use client";

import { useState } from "react";

import type { VerdictOutcome, VerdictVote } from "@/lib/firebase/schema";

import { isPlayerEligibleForVerdict } from "@/game-engine/verdict-result";
import { DEFAULT_VERDICT_VOTING_SETTINGS } from "./voting-settings";
import { usePlayerVerdictVote } from "./use-player-verdict-vote";
import { saveVerdictVote } from "./voting-repository";

const VERDICT_OPTIONS: ReadonlyArray<{ value: VerdictVote; label: string }> = [
  { value: "guilty", label: "Culpado" },
  { value: "innocent", label: "Inocente" },
  { value: "abstain", label: "Abster-se" },
];

const OUTCOME_LABELS: Record<VerdictOutcome, string> = {
  guilty: "Culpado",
  innocent: "Inocente",
  tie: "Empate — sem decisão",
};

interface PlayerVerdictVotingProps {
  gameId: string;
  dayNumber: number;
  playerUid: string;
  playerAlive: boolean;
  accusedPlayerUid?: string | null;
  verdictClosedAt?: number | null;
  verdictOutcome?: VerdictOutcome | null;
}

export function PlayerVerdictVoting(props: PlayerVerdictVotingProps) {
  const currentVote = usePlayerVerdictVote(props.gameId, props.dayNumber);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const eligible = isPlayerEligibleForVerdict(
    props.playerUid,
    props.playerAlive,
    props.accusedPlayerUid,
    DEFAULT_VERDICT_VOTING_SETTINGS,
  );

  const handleVote = async (vote: VerdictVote) => {
    setBusy(true);
    setError(false);
    try {
      await saveVerdictVote(props.gameId, props.dayNumber, vote);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (props.verdictClosedAt) {
    return (
      <p className="mt-5 rounded-xl border border-[#d3b88c]/25 bg-[#d3b88c]/10 px-4 py-3 text-center font-bold text-[#fffaf0]">
        Veredito encerrado: {props.verdictOutcome ? OUTCOME_LABELS[props.verdictOutcome] : "resultado indisponível"}.
      </p>
    );
  }

  if (!eligible) {
    const reason = !props.playerAlive
      ? "Jogadores mortos não votam no veredito."
      : "Por configuração desta partida, o acusado não vota no próprio veredito.";
    return <p className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#bdb7ad]">{reason}</p>;
  }

  return (
    <section className="mt-5 rounded-2xl border border-[#d3b88c]/25 bg-black/20 p-4 sm:p-5">
      <h2 className="font-serif text-xl font-semibold text-[#fffaf0]">Seu veredito</h2>
      <p className="mt-1 text-sm text-[#bdb7ad]">Você pode alterar a escolha até o mestre encerrar a votação.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {VERDICT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={busy || !currentVote.loaded}
            onClick={() => void handleVote(option.value)}
            className={`min-h-12 rounded-xl border px-3 font-bold disabled:opacity-50 ${
              currentVote.vote === option.value
                ? "border-[#d3b88c] bg-[#d3b88c]/20 text-[#fffaf0]"
                : "border-white/10 bg-white/5 text-[#e5ded2]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {(error || currentVote.error) && (
        <p role="alert" className="mt-3 text-sm text-[#f0b9bd]">Não foi possível registrar seu veredito.</p>
      )}
    </section>
  );
}
