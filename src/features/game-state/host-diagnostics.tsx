"use client";

import { useState } from "react";

interface HostDiagnosticsProps {
  gameId: string;
  roomCode: string;
}

export function HostDiagnostics({ gameId, roomCode }: HostDiagnosticsProps) {
  const [feedback, setFeedback] = useState("");

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`${label} copiado.`);
    } catch {
      setFeedback(`Não foi possível copiar ${label.toLowerCase()}.`);
    }
  };

  return (
    <footer className="rounded-2xl border border-white/10 bg-black/15 p-4 text-xs text-[#9f9990]">
      <div className="flex flex-wrap items-center gap-2">
        <span>Salem Companion v0.1.0</span>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => void copy("Código", roomCode)} className="underline underline-offset-4">Copiar código {roomCode}</button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => void copy("Game ID", gameId)} className="underline underline-offset-4">Copiar gameId</button>
      </div>
      <p role="status" className="mt-2 min-h-4">{feedback}</p>
    </footer>
  );
}
