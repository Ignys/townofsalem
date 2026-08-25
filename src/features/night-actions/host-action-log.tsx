"use client";

import type { HostNightActionEntry } from "@/types";

import type { HostActionContext } from "./host-action-entry";
import { formatHostActionEntry } from "./host-action-entry";
import { cancelHostNightAction } from "./host-night-action-repository";

interface HostActionLogProps {
  gameId: string;
  entries: readonly HostNightActionEntry[];
  context: HostActionContext;
  locked?: boolean;
  onEdit: (entry: HostNightActionEntry) => void;
}

export function HostActionLog({ gameId, entries, context, locked, onEdit }: HostActionLogProps) {
  const ordered = [...entries].sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));

  return (
    <section className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-[#fffaf0]">Action Log</h3>
        <span className="text-xs text-[#9f9990]">Ações estruturadas</span>
      </div>
      {ordered.length === 0 ? (
        <p className="mt-3 text-sm text-[#9f9990]">Nenhuma ação registrada.</p>
      ) : (
        <ol className="mt-3 grid gap-2">
          {ordered.map((entry, index) => (
            <li key={entry.id} className={`rounded-xl border p-3 ${entry.status === "cancelled" ? "border-white/5 opacity-55" : "border-white/10"}`}>
              <p className="text-sm text-[#e5ded2]">{index + 1}. {formatHostActionEntry(entry, context)}</p>
              {entry.optionalNotes && <p className="mt-1 text-xs text-[#9f9990]">{entry.optionalNotes}</p>}
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={locked || entry.status === "cancelled"} onClick={() => onEdit(entry)} className="rounded-lg border border-white/15 px-2 py-1 text-xs disabled:opacity-50">Editar</button>
                <button type="button" disabled={locked || entry.status === "cancelled"} onClick={() => { if (window.confirm("Cancelar esta entrada do Action Log?")) void cancelHostNightAction(gameId, entry, Date.now()); }} className="rounded-lg border border-[#a33843]/35 px-2 py-1 text-xs text-[#f0b9bd] disabled:opacity-50">Cancelar</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
