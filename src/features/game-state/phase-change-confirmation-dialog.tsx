"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";

interface PhaseChangeConfirmationDialogProps {
  open: boolean;
  endingPhaseLabel: string;
  busy: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PhaseChangeConfirmationDialog({
  open,
  endingPhaseLabel,
  busy,
  errorMessage,
  onCancel,
  onConfirm,
}: PhaseChangeConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onCancel, open]);

  if (!open) return null;

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
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-sm rounded-2xl border border-[#d3b88c]/25 bg-[#1a1c1e] p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#d3b88c]/15 text-[#e6cfa9]">
            <TriangleAlert aria-hidden="true" size={20} strokeWidth={2} />
          </span>
          <div>
            <h2 id={titleId} className="font-serif text-xl font-semibold text-[#fffaf0]">
              Finalizar fase?
            </h2>
            <p id={descriptionId} className="mt-1 text-sm leading-6 text-[#bdb7ad]">
              Isso finalizará a <strong className="text-[#fffaf0]">{endingPhaseLabel}</strong>, tem certeza?
            </p>
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-4 rounded-lg bg-[#a33843]/15 px-3 py-2 text-sm text-[#f0b9bd]">
            {errorMessage}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-10 rounded-xl border border-white/15 px-4 font-semibold text-[#d8d2c8] hover:bg-white/5 disabled:opacity-50"
          >
            Não
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            disabled={busy}
            className="min-h-10 rounded-xl bg-[#7d2330] px-4 font-bold text-white hover:bg-[#681c27] disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Confirmando…" : "Sim"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
