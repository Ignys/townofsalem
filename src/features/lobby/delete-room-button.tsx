"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { requireAuthenticatedGameHost } from "@/features/game-state/require-authenticated-game-host";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";

/** Apaga a sala inteira (partida, código e anúncio na home) e volta para o início. */
/** compact: só o ícone, para caber no header do celular. */
export function DeleteRoomButton({ gameId, code, compact = false }: Readonly<{ gameId: string; code: string; compact?: boolean }>) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    const deleteRoom = async () => {
        if (busy || !window.confirm("Excluir a sala? Todos os jogadores serão desconectados e nada poderá ser recuperado.")) return;
        setBusy(true);
        try {
            await requireAuthenticatedGameHost(gameId);
            await applyAtomicUpdate({
                [firebasePaths.openRoom(code)]: null,
                [firebasePaths.roomCode(code)]: null,
                [firebasePaths.game(gameId)]: null,
            });
            router.push("/");
        } catch {
            setBusy(false);
            window.alert("Não foi possível excluir a sala.");
        }
    };

    return (
        <button
            type="button"
            disabled={busy}
            onClick={() => void deleteRoom()}
            aria-label={compact ? (busy ? "Excluindo sala" : "Excluir sala") : undefined}
            title={compact ? "Excluir sala" : undefined}
            className={`inline-flex min-h-10 ${compact ? "size-11" : ""} items-center justify-center gap-2 rounded-lg border border-[#a33843]/50 px-3 text-sm font-semibold text-[#f0b9bd] transition hover:bg-[#a33843]/15 focus-visible:outline-3 focus-visible:outline-[#d3b88c] disabled:opacity-50`}
        >
            <Trash2 aria-hidden="true" size={16} />
            {!compact && (busy ? "Excluindo…" : "Excluir sala")}
        </button>
    );
}
