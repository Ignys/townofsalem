"use client";

import type { NightWakeStatus, WakeChecklistState } from "@/types";

import type { NightWakeItem } from "./night-wake-plan";

interface NightWakeChecklistProps {
  items: readonly NightWakeItem[];
  states: Readonly<Record<string, WakeChecklistState>>;
  onSelect: (item: NightWakeItem) => void;
  onStatusChange: (itemId: string, status: NightWakeStatus) => void;
  disabled?: boolean;
}

export function NightWakeChecklist({ items, states, onSelect, onStatusChange, disabled }: NightWakeChecklistProps) {
  const completed = items.filter(({ id }) => states[id]?.status === "completed").length;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-[#fffaf0]">Quem acorda</h3>
        <span className="text-xs font-bold text-[#d3b88c]">{completed} de {items.length} registrados</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[#9f9990]">Nenhuma role noturna confirmada no catálogo para os jogadores vivos.</p>
      ) : (
        <ol className="mt-3 grid gap-2">
          {items.map((item, index) => {
            const status = states[item.id]?.status ?? "pending";
            return (
              <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button type="button" disabled={disabled} onClick={() => onSelect(item)} className="min-h-10 text-left font-semibold text-[#fffaf0] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-50">
                    {index + 1}. {item.label}
                  </button>
                  <span className="text-xs text-[#bdb7ad]">{status === "completed" ? "Concluído" : status === "skipped" ? "Ignorado" : "Pendente"}</span>
                </div>
                {item.groupId && (
                  <details className="mt-2 text-xs text-[#bdb7ad]">
                    <summary className="cursor-pointer">Ver membros e roles</summary>
                    <ul className="mt-1 pl-4">
                      {item.members.map((member) => <li key={member.playerUid}>{member.playerName} — {member.roleName}</li>)}
                    </ul>
                  </details>
                )}
                <div className="mt-2 flex gap-2">
                  <button type="button" disabled={disabled} onClick={() => onStatusChange(item.id, "completed")} className="rounded-lg border border-[#6f9b77]/35 px-2 py-1 text-xs text-[#bfe0c5] disabled:opacity-50">Concluir</button>
                  <button type="button" disabled={disabled} onClick={() => onStatusChange(item.id, "skipped")} className="rounded-lg border border-white/15 px-2 py-1 text-xs text-[#bdb7ad] disabled:opacity-50">Ignorar</button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
