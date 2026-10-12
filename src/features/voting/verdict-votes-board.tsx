"use client";

import { useEffect, useState } from "react";

import { observePublicVerdicts } from "@/lib/firebase/realtime-database-repository";
import type { PublicPlayerRecord, VerdictVote } from "@/lib/firebase/schema";

const COLUMNS: readonly { vote: VerdictVote; label: string; tone: string }[] = [
  { vote: "guilty", label: "Culpado", tone: "text-[#f0b9bd]" },
  { vote: "innocent", label: "Inocente", tone: "text-[#bfe0c5]" },
  { vote: "abstain", label: "Abster-se", tone: "text-[#bdb7ad]" },
];

interface VerdictVotesState {
  key: string;
  verdicts: Record<string, VerdictVote>;
}

function usePublicVerdicts(gameId: string, dayNumber: number) {
  const key = `${gameId}:${dayNumber}`;
  const [state, setState] = useState<VerdictVotesState | null>(null);

  useEffect(
    () =>
      observePublicVerdicts(gameId, dayNumber, {
        onData: (value) => setState({ key: `${gameId}:${dayNumber}`, verdicts: value ?? {} }),
        onError: () => setState({ key: `${gameId}:${dayNumber}`, verdicts: {} }),
      }),
    [dayNumber, gameId],
  );

  return state?.key === key ? state.verdicts : {};
}

/** Quem vota: vivos, menos o acusado. */
export function groupVerdictVotes(
  verdicts: Readonly<Record<string, VerdictVote>>,
  players: Readonly<Record<string, PublicPlayerRecord>>,
  accusedUid: string | null | undefined,
  closed: boolean,
): Record<VerdictVote, string[]> {
  const groups: Record<VerdictVote, string[]> = { guilty: [], innocent: [], abstain: [] };
  const voters = Object.entries(players)
    .filter(([uid, player]) => player.alive && uid !== accusedUid)
    .sort(([, left], [, right]) => left.name.localeCompare(right.name, "pt-BR"));

  for (const [uid] of voters) {
    const vote = verdicts[uid];
    // Depois de fechado, quem não votou conta como abstenção.
    if (vote) groups[vote].push(uid);
    else if (closed) groups.abstain.push(uid);
  }
  return groups;
}

interface VerdictVotesBoardProps {
  gameId: string;
  dayNumber: number;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  accusedUid: string | null | undefined;
  closed: boolean;
}

/** Votos do veredito ao vivo, para todos: cada voto aparece (e muda) assim que é dado. */
export function VerdictVotesBoard({ gameId, dayNumber, players, accusedUid, closed }: VerdictVotesBoardProps) {
  const verdicts = usePublicVerdicts(gameId, dayNumber);
  const groups = groupVerdictVotes(verdicts, players, accusedUid, closed);

  return (
    <section aria-label="Votos do veredito" className="mt-4 rounded-2xl border border-[#d3b88c]/25 bg-black/20 p-4">
      <h2 className="font-serif text-lg font-semibold text-[#fffaf0]">
        {closed ? "Resultado da votação" : "Votos do veredito"}
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {COLUMNS.map(({ vote, label, tone }) => (
          <div key={vote} data-verdict-column={vote}>
            <p className={`text-xs font-bold tracking-[0.12em] uppercase ${tone}`}>
              {label} · {groups[vote].length}
            </p>
            <ul className="mt-2 grid gap-1 text-sm text-[#e5ded2]">
              {groups[vote].map((uid) => (
                <li key={uid} className="truncate">{players[uid]?.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
