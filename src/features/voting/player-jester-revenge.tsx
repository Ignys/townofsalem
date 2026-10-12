"use client";

import { useEffect, useState } from "react";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate, observePublicVerdicts } from "@/lib/firebase/realtime-database-repository";
import type { PublicPlayerRecord, VerdictVote } from "@/lib/firebase/schema";

interface PlayerJesterRevengeProps {
  gameId: string;
  dayNumber: number;
  viewerUid: string;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

/**
 * O Jester acabou de ser enforcado: escolhe na hora um dos que votaram culpado para morrer.
 * A escolha é única; a mesa aplica (ou descarta, se o prazo acabar).
 */
export function PlayerJesterRevenge({ gameId, dayNumber, viewerUid, players }: PlayerJesterRevengeProps) {
  const [verdicts, setVerdicts] = useState<Record<string, VerdictVote>>({});
  const [chosenUid, setChosenUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(
    () => observePublicVerdicts(gameId, dayNumber, {
      onData: (value) => setVerdicts(value ?? {}),
      onError: () => setVerdicts({}),
    }),
    [dayNumber, gameId],
  );

  const guiltyVoters = Object.entries(verdicts)
    .filter(([uid, vote]) => vote === "guilty" && uid !== viewerUid && players[uid]?.alive)
    .map(([uid]) => uid)
    .sort((left, right) => (players[left]?.name ?? "").localeCompare(players[right]?.name ?? "", "pt-BR"));

  const choose = (targetUid: string) => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid || saving || chosenUid) return;
    setSaving(true);
    setError(false);
    applyAtomicUpdate({ [firebasePaths.gameJesterRevenge(gameId, dayNumber, uid)]: targetUid })
      .then(() => setChosenUid(targetUid))
      .catch(() => setError(true))
      .finally(() => setSaving(false));
  };

  return (
    <section
      aria-label="Vingança do Jester"
      className="mt-4 rounded-2xl border border-[#a33843]/40 bg-[#a33843]/10 p-4"
    >
      <h2 className="font-serif text-xl font-semibold text-[#fffaf0]">Sua vingança</h2>
      {chosenUid ? (
        <p className="mt-2 text-sm text-[#f0b9bd]">
          Você escolheu <strong>{players[chosenUid]?.name}</strong>.
        </p>
      ) : guiltyVoters.length === 0 ? (
        <p className="mt-2 text-sm text-[#bdb7ad]">Ninguém vivo votou culpado. Não há vingança.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-[#e6cfa9]">
            Você foi enforcado. Escolha agora quem votou culpado para morrer com você.
          </p>
          <div className="mt-3 grid gap-2">
            {guiltyVoters.map((uid) => (
              <button
                key={uid}
                type="button"
                disabled={saving}
                onClick={() => choose(uid)}
                className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-left font-bold text-[#e5ded2] disabled:opacity-50"
              >
                {players[uid]?.name}
              </button>
            ))}
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
          Não foi possível registrar sua vingança.
        </p>
      )}
    </section>
  );
}
