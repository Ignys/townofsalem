"use client";

import { useState } from "react";

import { useSessionSync } from "./use-session-sync";

interface SessionSyncSheetProps {
  syncKey: string;
  code: string;
  onClose: () => void;
}

function Section({ name, value }: { name: string; value: unknown }) {
  const [open, setOpen] = useState(true);

  return (
    <section className="rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full px-3 py-2 text-left text-xs font-bold tracking-wider text-[#d8d2c8] uppercase"
      >
        {name}
      </button>
      {open ? (
        <pre className="overflow-x-auto px-3 pb-3 text-[11px] leading-snug text-[#bdb6aa]">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}

export default function SessionSyncSheet({
  syncKey,
  code,
  onClose,
}: SessionSyncSheetProps) {
  const { data, failed, refresh } = useSessionSync(syncKey, code, true);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f0d0b]/95">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 p-3">
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-white/15 px-3 py-1 text-xs text-[#d8d2c8]"
        >
          ↻
        </button>
        <button
          type="button"
          onClick={() => {
            if (data) {
              void navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
            }
          }}
          className="rounded-lg border border-white/15 px-3 py-1 text-xs text-[#d8d2c8]"
        >
          ⧉
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/15 px-3 py-1 text-xs text-[#d8d2c8]"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {failed ? <p className="text-xs text-[#f0b9bd]">—</p> : null}
        {data
          ? Object.entries(data).map(([name, value]) => (
              <Section key={name} name={name} value={value} />
            ))
          : null}
      </div>
    </div>
  );
}
