"use client";

import { useEffect, useState } from "react";

import {
  observeAuthenticatedPlayerDawnResults,
  observeAuthenticatedPlayerInstantResults,
  observeDayAnnouncements,
} from "@/lib/firebase/realtime-database-repository";
import type {
  DayAnnouncementRecord,
  PlayerDawnNightResultRecord,
  PlayerInstantNightResultRecord,
} from "@/types";

type InstantResults = Record<string, Record<string, PlayerInstantNightResultRecord>>;

function latestByNightNumber<Value extends { nightNumber: number }>(
  records: Readonly<Record<string, Value>>,
): Value | undefined {
  return Object.values(records).sort((left, right) => right.nightNumber - left.nightNumber)[0];
}

/** Resultados instantâneos de uma noite, na ordem em que foram entregues. */
export function usePlayerInstantNightResults(gameId: string, nightId: string | null | undefined) {
  const [results, setResults] = useState<InstantResults>({});

  useEffect(
    () => observeAuthenticatedPlayerInstantResults(gameId, {
      onData: (value) => setResults(value ?? {}),
      onError: () => setResults({}),
    }),
    [gameId],
  );

  return nightId
    ? Object.values(results[nightId] ?? {}).sort((left, right) => left.createdAt - right.createdAt)
    : [];
}

/**
 * Anúncio e resultado pessoal da última noite resolvida. As regras só liberam a leitura fora
 * da noite, então a assinatura é refeita quando a fase muda.
 */
export function usePlayerDawnNightResults(gameId: string, revealed: boolean) {
  const [dawnResults, setDawnResults] = useState<Record<string, PlayerDawnNightResultRecord>>({});
  const [announcements, setAnnouncements] = useState<Record<string, DayAnnouncementRecord>>({});

  useEffect(() => {
    if (!revealed) return;

    const stopDawn = observeAuthenticatedPlayerDawnResults(gameId, {
      onData: (value) => setDawnResults(value ?? {}),
      onError: () => setDawnResults({}),
    });
    const stopAnnouncements = observeDayAnnouncements(gameId, {
      onData: (value) => setAnnouncements(value ?? {}),
      onError: () => setAnnouncements({}),
    });

    return () => {
      stopDawn();
      stopAnnouncements();
    };
  }, [gameId, revealed]);

  if (!revealed) return { announcement: undefined, dawnResult: undefined };

  const announcement = latestByNightNumber(announcements);
  const dawnResult = latestByNightNumber(dawnResults);

  return {
    announcement,
    // O resultado pessoal só aparece junto do anúncio da mesma noite.
    dawnResult: dawnResult && dawnResult.nightNumber === announcement?.nightNumber ? dawnResult : undefined,
  };
}
