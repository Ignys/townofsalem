"use client";

import { useState } from "react";

import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

/** Botão do Mayor para se revelar à cidade. Só de dia, uma vez, e não dá para desfazer. */
export function PlayerMayorReveal({ gameId, day }: Readonly<{ gameId: string; day: number }>) {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const reveal = () => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid || saving) return;
    setSaving(true);
    setError(false);
    // Guarda o dia da revelação, mostrado a todos nos detalhes do jogador.
    applyAtomicUpdate({ [firebasePaths.gameMayorReveal(gameId, uid)]: Math.max(1, day) })
      .catch(() => setError(true))
      .finally(() => setSaving(false));
  };

  return (
    <section aria-label="Revelar Mayor" className="panel-private mt-4">
      <h2 className="font-serif text-lg font-semibold text-[#fffaf0]">Você é o Mayor</h2>
      <p className="mt-1 text-sm text-[#bdb7ad]">
        Revelado, seu voto pesa mais no veredito, mas o Doctor não consegue mais te proteger.
      </p>
      {confirming ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="btn-quiet-dark"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={reveal}
            className="btn-primary"
          >
            {saving ? "Revelando…" : "Revelar agora"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn-primary mt-3 w-full"
        >
          Revelar-se como Mayor
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
          Não foi possível se revelar.
        </p>
      )}
    </section>
  );
}
