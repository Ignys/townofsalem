"use client";

import { Check, Clipboard, Share2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { buildRoomShareUrl } from "@/lib/utils/room-share-url";

import { DeleteRoomButton } from "./delete-room-button";
import type { FirebaseConnectionStatus } from "./use-firebase-connection";

const CONNECTION: Record<FirebaseConnectionStatus, { label: string; dot: string }> = {
    connecting: { label: "Conectando…", dot: "bg-[#c18b2f]" },
    connected: { label: "Sala online", dot: "bg-[#6f9b77]" },
    reconnecting: { label: "Reconectando…", dot: "bg-[#c18b2f]" },
    unavailable: { label: "Sem conexão", dot: "bg-[#a33843]" },
};

interface MobileRoomSettingsProps {
    code: string;
    gameId: string;
    connectionStatus: FirebaseConnectionStatus;
    playModeSelector: ReactNode;
}

/** Aba Sala do celular: convite em destaque, modo de jogo e, longe do polegar, excluir. */
export function MobileRoomSettings({ code, gameId, connectionStatus, playModeSelector }: MobileRoomSettingsProps) {
    const [feedback, setFeedback] = useState<"code" | "link" | "error" | null>(null);
    const connection = CONNECTION[connectionStatus];

    const copy = async (value: string, kind: "code" | "link") => {
        try {
            await navigator.clipboard.writeText(value);
            setFeedback(kind);
        } catch {
            setFeedback("error");
        }
    };

    // O menu de compartilhar do celular leva o link direto ao WhatsApp; sem ele, copia.
    const share = async () => {
        const url = buildRoomShareUrl(window.location.origin, code);
        if (!navigator.share) return copy(url, "link");
        try {
            await navigator.share({ title: "Town of Salem", text: `Entre na sala ${code}`, url });
        } catch {
            // Fechar o menu sem escolher nada não é erro.
        }
    };

    return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
            <section aria-labelledby="invite-title" className="panel-private relative overflow-hidden px-4 pt-5 pb-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full bg-[#c18b2f]/12 blur-3xl" />
                <div className="relative flex items-center justify-between gap-3">
                    <h2 id="invite-title" className="font-serif text-lg font-semibold text-[#fffaf0]">
                        Convite
                    </h2>
                    <p className="flex items-center gap-1.5 text-xs text-[#a9a297]">
                        <span aria-hidden="true" className={`size-2 rounded-full ${connection.dot}`} />
                        {connection.label}
                    </p>
                </div>

                <p aria-label={`Código da sala: ${code.split("").join(" ")}`} className="relative mt-4 grid grid-cols-6 gap-1.5">
                    {code.split("").map((char, index) => (
                        <span
                            key={index}
                            aria-hidden="true"
                            className="grid aspect-[4/5] place-items-center rounded-lg border border-[#d3b88c]/25 bg-[#111315] font-serif text-[1.75rem] font-semibold text-[#f6dfb5] shadow-[inset_0_-3px_0_rgba(211,184,140,0.12)]"
                        >
                            {char}
                        </span>
                    ))}
                </p>

                <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <button type="button" onClick={() => void share()} className="btn-primary flex items-center justify-center gap-2">
                        <Share2 aria-hidden="true" className="size-4" />
                        Compartilhar convite
                    </button>
                    <button type="button" onClick={() => void copy(code, "code")} className="btn-quiet-dark flex items-center gap-2">
                        {feedback === "code" ? <Check aria-hidden="true" className="size-4 text-[#bfe0c5]" /> : <Clipboard aria-hidden="true" className="size-4" />}
                        Código
                    </button>
                </div>
                <p role="status" className={`relative mt-2 min-h-4 text-center text-xs ${feedback === "error" ? "text-[#f0b9bd]" : "text-[#bfe0c5]"}`}>
                    {feedback === "code" ? "Código copiado." : feedback === "link" ? "Link copiado." : feedback === "error" ? "Não foi possível copiar." : ""}
                </p>
            </section>

            <section className="panel-private px-4">{playModeSelector}</section>

            <section aria-label="Excluir sala" className="mt-4 grid gap-2 border-t border-white/10 pt-5">
                <p className="text-xs leading-5 text-[#8d877e]">Excluir encerra a sala para todos e tira ela da lista de salas abertas.</p>
                <div className="[&>*]:w-full">
                    <DeleteRoomButton gameId={gameId} code={code} />
                </div>
            </section>
        </div>
    );
}
