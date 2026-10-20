"use client";

import { useEffect, useState } from "react";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate, observeAuthenticatedNightPass } from "@/lib/firebase/realtime-database-repository";

function savePass(gameId: string, nightId: string): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return Promise.reject(new Error("not-authenticated"));
  return applyAtomicUpdate({ [firebasePaths.gameNightPass(gameId, nightId, uid)]: Date.now() });
}

/**
 * Ritmo rápido: a noite acaba quando todo mundo avisou que está pronto. Como a escolha
 * pode mudar até o fim, só esse aviso (definitivo) encerra a noite antes do timer.
 */
export function PlayerNightPass({ gameId, nightId }: Readonly<{ gameId: string; nightId: string }>) {
  const [passed, setPassed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(
    () => observeAuthenticatedNightPass(gameId, nightId, {
      onData: (value) => setPassed(Boolean(value)),
      onError: () => setPassed(false),
    }),
    [gameId, nightId],
  );

  if (passed) {
    return <p className="mt-3 text-sm text-[#bfe0c5]">Você está pronto. A noite acaba quando todos estiverem.</p>;
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          setError(false);
          savePass(gameId, nightId)
            .catch(() => setError(true))
            .finally(() => setSaving(false));
        }}
        className="btn-quiet-dark w-full"
      >
        Estou pronto
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
          Não foi possível avisar que você está pronto.
        </p>
      )}
    </div>
  );
}
