"use client";

import type { PlayerNightResultLine } from "@/types";

import { NightResolutionMessage } from "./night-resolution-message";
import { usePlayerDawnNightResults, usePlayerInstantNightResults } from "./use-player-night-results";

function ResultLines({ lines }: Readonly<{ lines: readonly PlayerNightResultLine[] }>) {
  return (
    <ul className="mt-2 grid gap-1 text-sm leading-6 text-[#e5ded2]">
      {lines.map((line, index) => (
        <li key={index}>
          <NightResolutionMessage line={line} />
        </li>
      ))}
    </ul>
  );
}

/** Investigações e pistas que o jogador recebe na hora em que confirma a ação. */
export function PlayerInstantNightResults({
  gameId,
  nightId,
}: Readonly<{ gameId: string; nightId: string | null | undefined }>) {
  const results = usePlayerInstantNightResults(gameId, nightId);
  if (results.length === 0) return null;

  return (
    <section
      aria-label="Resultado da sua ação"
      className="mt-4 rounded-2xl border border-[#6f9b77]/30 bg-[#6f9b77]/10 p-4 text-left"
    >
      <h2 className="text-xs font-bold tracking-[0.15em] text-[#bfe0c5] uppercase">Resultado</h2>
      <ResultLines lines={results.map(({ line }) => line)} />
    </section>
  );
}

/** O que a cidade e o próprio jogador descobrem quando a noite acaba. */
export function PlayerDawnNightResults({
  gameId,
  revealed,
}: Readonly<{ gameId: string; revealed: boolean }>) {
  const { announcement, dawnResult } = usePlayerDawnNightResults(gameId, revealed);
  if (!announcement) return null;

  return (
    <>
      <section
        aria-label="Anúncios do dia"
        className="mt-4 rounded-2xl border border-[#d3b88c]/25 bg-[#1f1c17] p-4"
      >
        <h2 className="text-xs font-bold tracking-[0.15em] text-[#9f9990] uppercase">
          Anúncios do dia · Noite {announcement.nightNumber}
        </h2>
        <ResultLines lines={announcement.lines} />
      </section>

      {dawnResult && (
        <section
          aria-label="Sua noite"
          className="mt-4 rounded-2xl border border-[#3b4a6b]/40 bg-[#151a26] p-4"
        >
          <h2 className="text-xs font-bold tracking-[0.15em] text-[#a9b3cc] uppercase">Sua noite</h2>
          <ResultLines lines={dawnResult.lines} />
        </section>
      )}
    </>
  );
}
