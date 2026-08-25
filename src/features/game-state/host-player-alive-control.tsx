"use client";

import { useRef, useState } from "react";

interface HostPlayerAliveControlProps {
  gameId: string;
  playerUid: string;
  playerName: string;
  alive: boolean;
  disabled?: boolean;
}

export function HostPlayerAliveControl({
  gameId,
  playerUid,
  playerName,
  alive,
  disabled = false,
}: HostPlayerAliveControlProps) {
  const updateInProgress = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async () => {
    if (updateInProgress.current) {
      return;
    }

    if (
      alive &&
      !window.confirm(`Confirmar que ${playerName} está morto?`)
    ) {
      return;
    }

    updateInProgress.current = true;
    setBusy(true);
    setError(null);

    try {
      const { updatePlayerAliveStatus } = await import(
        "./update-player-alive-status"
      );
      await updatePlayerAliveStatus(gameId, playerUid, !alive);
    } catch {
      setError("Não foi possível atualizar o status.");
    } finally {
      updateInProgress.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="col-span-2 flex items-center justify-between gap-3 border-t border-white/8 pt-2">
      <span className="text-xs text-[#9f9990]">
        {error ?? "Status administrativo"}
      </span>
      <button
        type="button"
        onClick={() => void handleChange()}
        disabled={busy || disabled}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-50 ${
          alive
            ? "bg-[#a33843]/15 text-[#f0b9bd] hover:bg-[#a33843]/25"
            : "bg-[#6f9b77]/15 text-[#bfe0c5] hover:bg-[#6f9b77]/25"
        }`}
      >
        {busy ? "Salvando…" : alive ? "Marcar morto" : "Reviver"}
      </button>
    </div>
  );
}
