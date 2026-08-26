"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Ban } from "lucide-react";

interface HostPlayerRemovalDialogProps {
    playerName: string;
    isBot: boolean;
    open: boolean;
    busy: boolean;
    error: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export function HostPlayerRemovalDialog({ playerName, isBot, open, busy, error, onCancel, onConfirm }: HostPlayerRemovalDialogProps) {
    const titleId = useId();

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !busy) {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [busy, onCancel, open]);

    if (!open) {
        return null;
    }

    const action = isBot ? "remover" : "expulsar";

    return createPortal(
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) {
                    onCancel();
                }
            }}
        >
            <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#1a1c1e] p-5 shadow-2xl">
                <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#a33843]/15 text-[#f0b9bd]">
                        <Ban aria-hidden="true" size={20} strokeWidth={2} />
                    </span>
                    <div>
                        <h2 id={titleId} className="font-serif text-xl font-semibold text-[#fffaf0]">
                            {isBot ? "Remover bot?" : "Expulsar jogador?"}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-[#bdb7ad]">
                            Deseja realmente {action} <strong className="text-[#fffaf0]">{playerName}</strong> da sala?
                        </p>
                    </div>
                </div>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-[#a33843]/15 px-3 py-2 text-sm text-[#f0b9bd]">
                        Não foi possível {action}. Tente novamente.
                    </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onCancel} disabled={busy} className="min-h-10 rounded-xl border border-white/15 px-4 font-semibold text-[#d8d2c8] hover:bg-white/5 disabled:opacity-50">
                        Cancelar
                    </button>
                    <button
                        type="button"
                        autoFocus
                        onClick={onConfirm}
                        disabled={busy}
                        className="min-h-10 rounded-xl bg-[#7d2330] px-4 font-bold text-white hover:bg-[#681c27] disabled:cursor-wait disabled:opacity-60"
                    >
                        {busy ? (isBot ? "Removendo…" : "Expulsando…") : isBot ? "Remover" : "Expulsar"}
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}
