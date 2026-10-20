"use client";

import { useState } from "react";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

import { useDawnReady } from "./dawn-ready-meter";

function saveReady(gameId: string, day: number): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return Promise.reject(new Error("not-authenticated"));
  return applyAtomicUpdate({ [firebasePaths.gameDawnReady(gameId, day, uid)]: Date.now() });
}

/** Preparação: o jogador avisa que leu os resultados da noite. */
export function PlayerDawnReady({ gameId, day, viewerUid }: Readonly<{ gameId: string; day: number; viewerUid: string }>) {
  const ready = Boolean(useDawnReady(gameId, day)[viewerUid]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  if (ready) {
    return <p className="mt-4 text-center text-sm text-[#bfe0c5]">Você está pronto. A discussão começa quando todos estiverem.</p>;
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          setError(false);
          saveReady(gameId, day)
            .catch(() => setError(true))
            .finally(() => setSaving(false));
        }}
        className="btn-primary w-full"
      >
        Pronto
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
          Não foi possível avisar que você está pronto.
        </p>
      )}
    </div>
  );
}
