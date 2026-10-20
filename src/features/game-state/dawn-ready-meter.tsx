"use client";

import { useEffect, useState } from "react";

import { observeDawnReady } from "@/lib/firebase/realtime-database-repository";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";

/** Quem já apertou "Pronto" na preparação deste dia. */
export function useDawnReady(gameId: string, day: number | null | undefined) {
  const [ready, setReady] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!day) return;
    return observeDawnReady(gameId, day, {
      onData: (value) => setReady(value ?? {}),
      onError: () => setReady({}),
    });
  }, [day, gameId]);

  return day ? ready : {};
}

/** Vivos que ainda não apertaram "Pronto". */
export function missingDawnReady(
  players: Readonly<Record<string, PublicPlayerRecord>>,
  ready: Readonly<Record<string, number>>,
) {
  return Object.entries(players).filter(([uid, player]) => player.alive && !ready[uid]);
}

/**
 * Ocupa o lugar do timer na preparação: um sol por jogador vivo, que acende quando ele
 * aperta "Pronto". A discussão começa quando todos acendem.
 */
export function DawnReadyMeter({
  gameId,
  day,
  players,
  revealMissing = false,
}: Readonly<{
  gameId: string;
  day: number;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  /** Só a mesa: nomes de quem falta, borrados até passar o mouse (ou focar). */
  revealMissing?: boolean;
}>) {
  const ready = useDawnReady(gameId, day);
  const alive = Object.entries(players)
    .filter(([, player]) => player.alive)
    .sort(([left], [right]) => Number(Boolean(ready[right])) - Number(Boolean(ready[left])) || left.localeCompare(right));
  const missing = missingDawnReady(players, ready);

  return (
    <div role="status" aria-live="polite" className="text-center">
      <ul aria-hidden="true" className="flex flex-wrap justify-center gap-1.5">
        {alive.map(([uid]) => (
          <li
            key={uid}
            className={`size-3 rounded-full transition-[background-color,box-shadow] duration-500 motion-reduce:transition-none ${
              ready[uid]
                ? "bg-[#f2c879] shadow-[0_0_10px_2px_rgba(242,200,121,0.55)]"
                : "border border-[#f2c879] bg-transparent"
            }`}
          />
        ))}
      </ul>
      <p className="mt-3 font-serif text-sm italic text-[#f2c879]">
        {missing.length === 0 ? "Todos prontos. O dia vai começar." : "prontos para começar o dia"}
      </p>
      {revealMissing && missing.length > 0 && (
        <p
          tabIndex={0}
          title="Passe o mouse para ver quem falta"
          className="mx-auto mt-1 max-w-xs cursor-default rounded-md text-sm leading-6 text-[#e6cfa9] blur-sm transition-[filter] duration-200 select-none hover:blur-none focus-visible:blur-none focus-visible:outline-2 focus-visible:outline-[#f2c879] motion-reduce:transition-none"
        >
          Esperando {missing.map(([, player]) => player.name).join(", ")}.
        </p>
      )}
    </div>
  );
}
