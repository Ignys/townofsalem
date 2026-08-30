"use client";

import { useEffect, useState } from "react";

import { observePublicAccusations } from "@/lib/firebase/realtime-database-repository";

interface AccusationsState {
  key: string;
  accusations: Record<string, string>;
  error: boolean;
}

/** Placar de acusações ao vivo, visível a todos os membros da partida. */
export function usePublicAccusations(gameId: string, dayNumber: number) {
  const key = `${gameId}:${dayNumber}`;
  const [state, setState] = useState<AccusationsState | null>(null);

  useEffect(
    () =>
      observePublicAccusations(gameId, dayNumber, {
        onData: (value) =>
          setState({ key: `${gameId}:${dayNumber}`, accusations: value ?? {}, error: false }),
        onError: () =>
          setState({ key: `${gameId}:${dayNumber}`, accusations: {}, error: true }),
      }),
    [dayNumber, gameId],
  );

  // `loaded` é derivado da chave para não precisar reiniciar estado dentro do efeito.
  const fresh = state?.key === key ? state : null;

  return {
    accusations: fresh?.accusations ?? {},
    loaded: fresh !== null,
    error: fresh?.error ?? false,
  };
}
