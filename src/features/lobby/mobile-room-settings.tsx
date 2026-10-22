"use client";

import { Check, Clipboard, Share2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { copyText } from "@/lib/utils/copy-text";
import { buildRoomShareUrl } from "@/lib/utils/room-share-url";

import type { FirebaseConnectionStatus } from "./use-firebase-connection";

const CONNECTION: Record<FirebaseConnectionStatus, { label: string; dot: string }> = {
    connecting: { label: "Conectando…", dot: "bg-[#c18b2f]" },
    connected: { label: "Sala online", dot: "bg-[#6f9b77]" },
    reconnecting: { label: "Reconectando…", dot: "bg-[#c18b2f]" },
    unavailable: { label: "Sem conexão", dot: "bg-[#a33843]" },
};

interface MobileRoomSettingsProps {
    code: string;
    connectionStatus: FirebaseConnectionStatus;
    playModeSelector: ReactNode;
}

/** Aba Sala do celular: convite em destaque e modo de jogo; excluir fica no header. */
export function MobileRoomSettings({ code, connectionStatus, playModeSelector }: MobileRoomSettingsProps) {
    const [feedback, setFeedback] = useState<"code" | "link" | "error" | null>(null);
    const connection = CONNECTION[connectionStatus];

    const copy = async (value: string, kind: "code" | "link") => {
        try {
            await copyText(value);
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
        } catch (error) {
            // Fechar o menu sem escolher nada não é erro; qualquer outra falha cai na cópia.
            if (!(error instanceof DOMException && error.name === "AbortError")) await copy(url, "link");
        }
    };

    return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
            {/* Sem cards: o convite fica direto na noite, as seções se separam por fios. */}
            <section aria-labelledby="invite-title" className="relative px-1 pt-4 pb-2">
                <div aria-hidden="true" className="pointer-events-none absolute top-6 left-1/2 h-28 w-72 -translate-x-1/2 rounded-full bg-[#c18b2f]/14 blur-3xl" />
                <div className="relative flex items-center justify-center gap-2 text-xs text-[#a9a297]">
                    <h2 id="invite-title">Código da sala</h2>
                    <span aria-hidden="true" className="h-3 w-px bg-white/15" />
                    <p className="flex items-center gap-1.5">
                        <span aria-hidden="true" className={`size-1.5 rounded-full ${connection.dot}`} />
                        {connection.label}
                    </p>
                </div>

                <p aria-label={`Código da sala: ${code.split("").join(" ")}`} className="relative mx-auto mt-4 grid max-w-[22rem] grid-cols-6 gap-2">
                    {code.split("").map((char, index) => (
                        <span
                            key={index}
                            aria-hidden="true"
                            className="grid aspect-[3/4] place-items-center rounded-xl border border-[#d3b88c]/30 bg-[linear-gradient(180deg,#1d1f23,#141619)] font-serif text-[2rem] font-semibold text-[#f6dfb5] shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(246,223,181,0.08)]"
                        >
                            {char}
                        </span>
                    ))}
                </p>

                <div className="relative mt-5 grid grid-cols-[1fr_auto] gap-2">
                    <button type="button" onClick={() => void share()} className="btn-primary flex min-h-12 items-center justify-center gap-2">
                        <Share2 aria-hidden="true" className="size-4" />
                        Compartilhar convite
                    </button>
                    <button type="button" onClick={() => void copy(code, "code")} aria-label="Copiar código" className="btn-quiet-dark flex min-h-12 items-center gap-2">
                        {feedback === "code" ? <Check aria-hidden="true" className="size-4 text-[#bfe0c5]" /> : <Clipboard aria-hidden="true" className="size-4" />}
                        Código
                    </button>
                </div>
                <p role="status" className={`relative mt-2 min-h-4 text-center text-xs ${feedback === "error" ? "text-[#f0b9bd]" : "text-[#bfe0c5]"}`}>
                    {feedback === "code" ? "Código copiado." : feedback === "link" ? "Link copiado." : feedback === "error" ? "Não foi possível copiar." : ""}
                </p>
            </section>

            <div aria-hidden="true" className="my-4 h-px bg-linear-to-r from-transparent via-[#d3b88c]/35 to-transparent" />

            <section className="px-1">{playModeSelector}</section>
        </div>
    );
}
