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
 * Ritmo rápido: a noite acaba quando todo mundo agiu. Quem não quer agir (ex.: Veteran que
 * não vai entrar em alerta) avisa aqui, senão a noite espera o timer.
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
    return <p className="mt-3 text-sm text-[#bfe0c5]">Você passou esta noite.</p>;
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
        className="min-h-11 w-full rounded-xl border border-white/10 px-4 text-sm font-bold text-[#bdb7ad] disabled:opacity-50"
      >
        Passar a noite
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
          Não foi possível passar a noite.
        </p>
      )}
    </div>
  );
}
