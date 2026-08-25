"use client";

import { useRef, useState } from "react";

import type { HostNightNote } from "@/types";

import { deleteHostNightNote, saveHostNightNote } from "./host-night-action-repository";

interface HostNightNotesProps {
  gameId: string;
  nightId: string;
  notes: readonly HostNightNote[];
  locked?: boolean;
}

export function HostNightNotes({ gameId, nightId, notes, locked }: HostNightNotesProps) {
  const saving = useRef(false);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<HostNightNote | null>(null);

  const addNote = async () => {
    const normalized = text.trim();
    if (!normalized || saving.current) return;
    saving.current = true;
    const now = Date.now();
    try {
      await saveHostNightNote(gameId, {
        id: editing?.id ?? crypto.randomUUID(),
        nightId,
        text: normalized,
        createdAt: editing?.createdAt ?? now,
        updatedAt: now,
      });
      setText("");
      setEditing(null);
    } finally {
      saving.current = false;
    }
  };

  return (
    <section className="rounded-2xl border border-dashed border-white/15 p-4">
      <h3 className="font-semibold text-[#fffaf0]">Notas do mestre</h3>
      <p className="mt-1 text-xs text-[#9f9990]">Notas não entram no Game Engine.</p>
      <div className="mt-3 flex gap-2">
        <input aria-label="Nova nota do mestre" value={text} maxLength={1000} disabled={locked} onChange={(event) => setText(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-black/20 px-3" />
        <button type="button" disabled={locked || !text.trim()} onClick={() => void addNote()} className="rounded-xl border border-white/15 px-4 font-bold disabled:opacity-50">{editing ? "Salvar" : "Adicionar"}</button>
      </div>
      <ul className="mt-3 grid gap-2">
        {[...notes].sort((a, b) => a.createdAt - b.createdAt).map((note) => (
          <li key={note.id} className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.04] p-2 text-sm">
            <span>{note.text}</span>
            <span className="flex gap-2">
              <button type="button" disabled={locked} onClick={() => { setEditing(note); setText(note.text); }} className="text-xs text-[#e6cfa9] disabled:opacity-50">Editar</button>
              <button type="button" disabled={locked} onClick={() => { if (window.confirm("Remover esta nota?")) void deleteHostNightNote(gameId, note); }} className="text-xs text-[#f0b9bd] disabled:opacity-50">Remover</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
