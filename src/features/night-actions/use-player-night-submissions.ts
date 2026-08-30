"use client";

import { useEffect, useState } from "react";

import { observeAuthenticatedPlayerNightActions } from "@/lib/firebase/realtime-database-repository";
import type { PlayerNightActionSubmission } from "@/types";

interface SubmissionsState {
  key: string;
  submissions: Record<string, PlayerNightActionSubmission>;
  error: boolean;
}

export function usePlayerNightSubmissions(
  gameId: string,
  nightId: string | null | undefined,
) {
  const key = `${gameId}:${nightId ?? ""}`;
  const [state, setState] = useState<SubmissionsState | null>(null);

  useEffect(() => {
    if (!nightId) return;

    const stateKey = `${gameId}:${nightId}`;
    return observeAuthenticatedPlayerNightActions(gameId, nightId, {
      onData: (value) =>
        setState({ key: stateKey, submissions: value ?? {}, error: false }),
      onError: () => setState({ key: stateKey, submissions: {}, error: true }),
    });
  }, [gameId, nightId]);

  const fresh = state?.key === key ? state : null;

  return {
    submissions: fresh?.submissions ?? {},
    // Sem noite ativa não há nada a carregar.
    loaded: !nightId || fresh !== null,
    error: fresh?.error ?? false,
  };
}
