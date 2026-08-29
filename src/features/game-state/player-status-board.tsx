"use client";

import { useMemo } from "react";

import { PlayerRoleTag } from "@/features/roles/player-role-tag";
import type { GraveyardEntryRecord, PublicPlayerRecord } from "@/lib/firebase/schema";

interface PlayerStatusBoardProps {
  players: Readonly<Record<string, PublicPlayerRecord>>;
  viewerUid: string;
  graveyard?: Readonly<Record<string, GraveyardEntryRecord>>;
}

function bySeat(
  [, left]: [string, PublicPlayerRecord],
  [, right]: [string, PublicPlayerRecord],
) {
  return (left.seat ?? Number.MAX_SAFE_INTEGER) - (right.seat ?? Number.MAX_SAFE_INTEGER);
}

/**
 * Public table state: who is still in, who is out, and where they sit.
 *
 * Living players never show a role — that stays with the host. Dead players do,
 * unless the Janitor cleaned the body, in which case the grave stays anonymous.
 */
export function PlayerStatusBoard({ players, viewerUid, graveyard }: PlayerStatusBoardProps) {
  const { alive, dead } = useMemo(() => {
    const entries = Object.entries(players).sort(bySeat);
    return {
      alive: entries.filter(([, player]) => player.alive),
      dead: entries.filter(([, player]) => !player.alive),
    };
  }, [players]);

  return (
    <section className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
          Na partida
        </h2>
        <span className="text-sm font-bold text-[#bfe0c5]">
          {alive.length} {alive.length === 1 ? "vivo" : "vivos"}
          {dead.length > 0 && (
            <span className="text-[#f0b9bd]"> · {dead.length} {dead.length === 1 ? "morto" : "mortos"}</span>
          )}
        </span>
      </div>

      <ul className="mt-3 grid gap-1.5">
        {[...alive, ...dead].map(([uid, player], index) => (
          <li
            key={uid}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
              player.alive
                ? "border-white/10 bg-white/5 text-[#e5ded2]"
                : "border-[#a33843]/25 bg-[#a33843]/10 text-[#c9a3a7]"
            }`}
          >
            {/* Only the host can assign seats, so fall back to the listed
                position the same way the host console does. */}
            <span className="min-w-6 font-mono text-xs text-[#8f8a82] tabular-nums">
              {player.seat ?? index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">
              <span className={player.alive ? undefined : "line-through"}>{player.name}</span>
              {uid === viewerUid && (
                <span className="ml-2 text-xs font-normal text-[#d3b88c]">você</span>
              )}
            </span>
            {player.disconnected && player.alive && (
              <span className="text-xs text-[#c18b2f]">desconectado</span>
            )}
            {!player.alive && graveyard?.[uid] && (
              graveyard[uid].cleaned || !graveyard[uid].roleId ? (
                <span className="shrink-0 rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[0.6875rem] font-medium text-[#9f9990] uppercase">
                  corpo limpo
                </span>
              ) : (
                <PlayerRoleTag roleId={graveyard[uid].roleId} />
              )
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
