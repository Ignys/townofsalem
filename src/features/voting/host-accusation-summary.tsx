"use client";

import { useState } from "react";

import { getPlayerEntries } from "@/features/game-state/player-roster";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";

import {
  countAccusationVotes,
  getVotesRequired,
} from "@/game-engine/accusation-counting";
import { startAccusedTrial } from "./start-accused-trial";
import { DEFAULT_ACCUSATION_VOTING_SETTINGS } from "./voting-settings";

interface HostAccusationSummaryProps {
  gameId: string;
  accusations?: Record<string, string>;
  players: Record<string, PublicPlayerRecord>;
}

export function HostAccusationSummary({
  gameId,
  accusations,
  players,
}: HostAccusationSummaryProps) {
  const [busyTarget, setBusyTarget] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const alivePlayers = getPlayerEntries(players).filter(([, player]) => player.alive);
  const counts = countAccusationVotes(
    accusations,
    new Set(alivePlayers.map(([playerUid]) => playerUid)),
  );
  const votesRequired = getVotesRequired(
    alivePlayers.length,
    DEFAULT_ACCUSATION_VOTING_SETTINGS,
  );

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
