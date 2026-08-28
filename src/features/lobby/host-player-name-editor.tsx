"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";

import {
  isValidPlayerName,
  normalizePlayerName,
  PLAYER_NAME_MAX_LENGTH,
} from "@/lib/utils/player-name";

import { renamePlayer } from "./host-player-actions";

interface HostPlayerNameEditorProps {
  gameId: string;
  playerUid: string;
  name: string;
  titleId: string;
}

export function HostPlayerNameEditor({
  gameId,
  playerUid,
  name,
  titleId,
}: HostPlayerNameEditorProps) {
  const [draftName, setDraftName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!savingRef.current) {
      setDraftName(name);
    }
  }, [name]);

  const saveName = async () => {
    if (savingRef.current) {
      return;
    }

    const normalizedName = normalizePlayerName(draftName);

    if (!isValidPlayerName(normalizedName)) {
      setSaveError("Digite um nome válido.");
      return;
    }

    setDraftName(normalizedName);
    setSaveError(null);

    if (normalizedName === name) {
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      await renamePlayer(gameId, playerUid, normalizedName);
    } catch {
      setSaveError("Não foi possível salvar o nome.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveName();
  };

  return (
    <form onSubmit={handleSubmit} className="min-w-0 w-fit">
      <h2
        id={titleId}
        className="group inline-flex max-w-full items-center gap-1.5 font-serif text-xl font-semibold text-[#fffaf0]"
      >
        <input
          type="text"
          value={draftName}
          maxLength={PLAYER_NAME_MAX_LENGTH}
          disabled={saving}
          aria-label={`Nome de ${name}`}
          aria-invalid={Boolean(saveError)}
          title="Edite o nome e pressione Enter para salvar"
          onChange={(event) => {
            setDraftName(event.target.value);
            setSaveError(null);
          }}
          onBlur={() => void saveName()}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setDraftName(name);
              setSaveError(null);
            }
          }}
          className="w-fit min-w-[2ch] max-w-[calc(100%+3rem)] [field-sizing:content] rounded-lg bg-transparent px-1 font-serif text-xl font-semibold text-[#fffaf0] outline-none transition-colors hover:bg-white/8 focus:bg-white/8 disabled:opacity-60"
        />
        <Pencil
          aria-hidden="true"
          size={15}
          className="shrink-0 text-[#d3b88c] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        />
      </h2>
      {saveError && (
        <p role="alert" className="mt-1 text-xs text-[#f0b9bd]">
          {saveError}
        </p>
      )}
    </form>
  );
}
