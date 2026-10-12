"use client";

import { useState } from "react";

import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import type { GamePlayMode } from "@/lib/firebase/schema";

const OPTIONS: readonly { mode: GamePlayMode; title: string; description: string }[] = [
  {
    mode: "hosted",
    title: "Com mestre",
    description: "Alguém conduz a partida pelo computador: vê as roles, revisa as ações e decide os casos especiais.",
  },
  {
    mode: "hostless",
    title: "Sem mestre",
    description: "O computador vira só a mesa: mostra fase, timer e anúncios, sem roles. O jogo se resolve sozinho pelo que os jogadores fazem no celular.",
  },
];

interface PlayModeSelectorProps {
  gameId: string;
  playMode: GamePlayMode;
}

/** Escolha do modo de jogo, só no lobby (a regra do RTDB trava o modo depois do início). */
export function PlayModeSelector({ gameId, playMode }: PlayModeSelectorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const select = (mode: GamePlayMode) => {
    if (mode === playMode || saving) return;
    setSaving(true);
    setError(false);
    applyAtomicUpdate({ [firebasePaths.gamePublicField(gameId, "playMode")]: mode })
      .catch(() => setError(true))
      .finally(() => setSaving(false));
  };

  return (
    <section aria-label="Modo de jogo" className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h2 className="text-xs font-bold tracking-[0.16em] text-zinc-400 uppercase">Modo de jogo</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = option.mode === playMode;
          return (
            <button
              key={option.mode}
              type="button"
              aria-pressed={selected}
              disabled={saving}
              onClick={() => select(option.mode)}
              className={`rounded-xl border p-4 text-left transition disabled:opacity-60 ${
                selected
                  ? "border-[#d3b88c] bg-[#d3b88c]/15"
                  : "border-white/10 bg-white/5 hover:border-white/25"
              }`}
            >
              <span className="block font-serif text-lg font-semibold text-[#fffaf0]">{option.title}</span>
              <span className="mt-1 block text-sm leading-6 text-zinc-400">{option.description}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#f0b9bd]">
          Não foi possível mudar o modo de jogo.
        </p>
      )}
    </section>
  );
}
