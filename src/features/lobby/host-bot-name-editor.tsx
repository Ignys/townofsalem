"use client";

import { useState, type FormEvent } from "react";
import { Bot, Check, Pencil, X } from "lucide-react";

import { PLAYER_NAME_MAX_LENGTH } from "@/lib/utils/player-name";

import { renameBotPlayer } from "./host-bot-actions";

interface HostBotNameEditorProps {
  gameId: string;
  playerUid: string;
  name: string;
}

export function HostBotNameEditor({
  gameId,
  playerUid,
  name,
}: HostBotNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const startEditing = () => {
    setDraftName(name);
    setSaveError(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraftName(name);
    setSaveError(false);
    setEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveError(false);

    try {
      await renameBotPlayer(gameId, playerUid, draftName);
      setEditing(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <Bot size={16} className="shrink-0 text-[#9f9990]" />
        <p className="truncate text-sm font-semibold text-[#fffaf0]">{name}</p>
        <button
          type="button"
          onClick={startEditing}
          aria-label={`Editar nome de ${name}`}
          title="Editar nome do bot"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#9f9990] hover:bg-white/8 hover:text-[#e6cfa9] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#d3b88c]"
        >
          <Pencil aria-hidden="true" size={14} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <div className="flex min-w-0 items-center gap-1">
        <input
          autoFocus
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          maxLength={PLAYER_NAME_MAX_LENGTH}
          disabled={saving}
          aria-label="Nome do bot"
          className="min-w-0 flex-1 rounded-lg border border-[#d3b88c]/35 bg-black/30 px-2 py-1 text-sm font-semibold text-[#fffaf0] outline-none focus:border-[#d3b88c] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={saving}
          aria-label="Salvar nome do bot"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#bfe0c5] hover:bg-[#6f9b77]/15 disabled:opacity-50"
        >
          <Check aria-hidden="true" size={15} />
        </button>
        <button
          type="button"
          onClick={cancelEditing}
          disabled={saving}
          aria-label="Cancelar edição"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#f0b9bd] hover:bg-[#a33843]/15 disabled:opacity-50"
        >
          <X aria-hidden="true" size={15} />
        </button>
      </div>
      {saveError && (
        <p role="alert" className="mt-1 text-xs text-[#f0b9bd]">
          Não foi possível salvar o nome.
        </p>
      )}
    </form>
  );
}
