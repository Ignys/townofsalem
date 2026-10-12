"use client";

import { useState } from "react";

import { getPlayerEntries } from "@/features/game-state/player-roster";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";
import type { GameVariants } from "@/game-engine/variants";
import { getEligibleVoterUids, getVoterWeights } from "./voter-rules";

import {
  countAccusationVotes,
  getVotesRequired,
} from "@/game-engine/accusation-counting";
import { startAccusedTrial } from "./start-accused-trial";
import { useAutoAccusedTrial } from "./use-auto-accused-trial";
import { DEFAULT_ACCUSATION_VOTING_SETTINGS } from "./voting-settings";

interface HostAccusationSummaryProps {
  gameId: string;
  day: number;
  accusations?: Record<string, string>;
  players: Record<string, PublicPlayerRecord>;
  privatePlayers: Record<string, PrivatePlayerRecord>;
  variants: GameVariants;
}

export function HostAccusationSummary({
  gameId,
  day,
  accusations,
  players,
  privatePlayers,
  variants,
}: HostAccusationSummaryProps) {
  const [busyTarget, setBusyTarget] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const alivePlayers = getPlayerEntries(players).filter(([, player]) => player.alive);
  const counts = countAccusationVotes(
    accusations,
    getEligibleVoterUids(players, privatePlayers, variants),
    getVoterWeights(privatePlayers, Object.keys(players).length),
  );
  const votesRequired = getVotesRequired(
    alivePlayers.length,
    DEFAULT_ACCUSATION_VOTING_SETTINGS,
  );
  const auto = useAutoAccusedTrial({
    gameId,
    enabled: true,
    day,
    accusations,
    players,
    privatePlayers,
    variants,
  });

  const handleTrial = async (targetUid: string, playerName: string) => {
    if (!window.confirm(`Iniciar o julgamento de ${playerName}? As acusações atuais serão encerradas.`)) {
      return;
    }

    setBusyTarget(targetUid);
    setError(false);
    try {
      await startAccusedTrial(gameId, targetUid);
    } catch {
      setError(true);
    } finally {
      setBusyTarget(null);
    }
  };

  return (
    <div className="mt-5">
      {auto.countdown !== null && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d3b88c]/45 bg-[#d3b88c]/15 px-4 py-3"
        >
          <p className="font-semibold text-[#fffaf0]">
            Maioria atingida — julgando{" "}
            <strong>{auto.targetName ?? "jogador"}</strong> em {auto.countdown}…
          </p>
          <button
            type="button"
            onClick={auto.cancel}
            className="min-h-10 shrink-0 rounded-lg border border-white/20 px-3 text-sm font-bold text-[#e5ded2]"
          >
            Cancelar
          </button>
        </div>
      )}
      {auto.error && (
        <p role="alert" className="mb-3 text-sm text-[#f0b9bd]">{auto.error}</p>
      )}
      <p className="text-sm text-[#bdb7ad]">
        Limiar: maioria estrita dos {alivePlayers.length} vivos ({votesRequired} votos).
      </p>
      <ul className="mt-3 grid gap-2">
        {alivePlayers.map(([playerUid, player]) => {
          const count = counts[playerUid] ?? 0;
          const reached = votesRequired > 0 && count >= votesRequired;
          return (
            <li key={playerUid} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3">
              <span className="font-semibold text-[#fffaf0]">{player.name}</span>
              <div className="flex items-center gap-3">
                <span className={reached ? "font-bold text-[#e6cfa9]" : "text-[#bdb7ad]"}>{count}/{votesRequired}</span>
                {reached && (
                  <button
                    type="button"
                    disabled={Boolean(busyTarget)}
                    onClick={() => void handleTrial(playerUid, player.name)}
                    className="min-h-10 rounded-lg bg-[#d3b88c] px-3 text-sm font-black text-[#17191b] disabled:opacity-50"
                  >
                    {busyTarget === playerUid ? "Iniciando…" : "Iniciar julgamento"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p role="alert" className="mt-3 text-sm text-[#f0b9bd]">O limiar mudou ou não foi possível iniciar o julgamento.</p>}
    </div>
  );
}
