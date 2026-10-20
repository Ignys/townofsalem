"use client";

import { useState } from "react";

import { usePlayerAccusationVote } from "./use-player-accusation-vote";
import { saveAccusationVote } from "./voting-repository";

/** O voto de acusação do jogador e a ação de trocar ou retirar (`null`). */
export function useAccusationVoting(gameId: string, dayNumber: number) {
  const current = usePlayerAccusationVote(gameId, dayNumber);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const accuse = async (targetUid: string | null) => {
    setBusy(true);
    setFailed(false);
    try {
      await saveAccusationVote(gameId, dayNumber, targetUid);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return {
    vote: current.vote,
    disabled: busy || !current.loaded || current.error,
    failed: failed || current.error,
    accuse,
  };
}
