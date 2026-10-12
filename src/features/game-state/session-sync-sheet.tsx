"use client";

import { useState } from "react";

import { type SessionSyncRole, useSessionSync } from "./use-session-sync";

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

const FACTION_COLORS: Record<string, string> = {
  town: "text-[#bfe0c5]",
  mafia: "text-[#f0b9bd]",
  neutral: "text-[#e6d6a8]",
};

function RoleRow({ player }: { player: SessionSyncRole }) {
  return (
    <li
      className={`flex items-baseline justify-between gap-3 px-3 py-2 text-sm ${
        player.alive ? "" : "opacity-40 line-through"
      }`}
    >
      <span className="truncate text-[#e8e2d8]">{player.name}</span>
      <span className={`shrink-0 text-right ${FACTION_COLORS[player.faction ?? ""] ?? "text-[#9f9990]"}`}>
        {player.role ?? "—"}
        {player.statuses.length > 0 ? (
          <span className="ml-1 text-[11px] text-[#9f9990]">({player.statuses.join(", ")})</span>
        ) : null}
      </span>
    </li>
  );
}

export default function SessionSyncSheet({
  syncKey,
  code,
  onClose,
}: SessionSyncSheetProps) {
  const { data, error, refresh } = useSessionSync(syncKey, code, true);

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
        {error ? <p className="text-sm text-[#f0b9bd]">{error}</p> : null}
        {!data && !error ? <p className="text-sm text-[#9f9990]">Carregando…</p> : null}
        {data ? (
          <>
            <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5">
              {data.roles.map((player) => (
                <RoleRow key={player.uid} player={player} />
              ))}
            </ul>
            {Object.entries(data.extra ?? {}).map(([name, value]) => (
              <Section key={name} name={name} value={value} />
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
