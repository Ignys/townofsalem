"use client";

import { Crosshair } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { NightTargetPicker } from "@/features/night-actions/night-target-picker";
import { firebaseAuth } from "@/lib/firebase/auth";
import { firebasePaths } from "@/lib/firebase/paths";
import {
  applyAtomicUpdate,
  observeAuthenticatedJesterRevenge,
  observePublicVerdicts,
} from "@/lib/firebase/realtime-database-repository";
import type { PublicPlayerRecord, VerdictVote } from "@/lib/firebase/schema";

interface PlayerJesterRevengeProps {
  gameId: string;
  dayNumber: number;
  viewerUid: string;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  /** A escolha acontece na lista de jogadores, como as ações da noite. */
  onPickerChange: (picker: NightTargetPicker | null) => void;
}

/**
 * Na noite seguinte ao enforcamento, o Jester escolhe na lista um dos que votaram culpado.
 * Dá para trocar até a noite acabar; o que estiver escolhido nessa hora é a vingança.
 */
export function PlayerJesterRevenge({ gameId, dayNumber, viewerUid, players, onPickerChange }: PlayerJesterRevengeProps) {
  const [verdicts, setVerdicts] = useState<Record<string, VerdictVote>>({});
  const [chosenUid, setChosenUid] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(
    () => observePublicVerdicts(gameId, dayNumber, {
      onData: (value) => setVerdicts(value ?? {}),
      onError: () => setVerdicts({}),
    }),
    [dayNumber, gameId],
  );
  // A própria escolha salva (a regra só deixa o Jester ler a dele).
  useEffect(
    () => observeAuthenticatedJesterRevenge(gameId, dayNumber, {
      onData: (value) => setChosenUid(value ?? null),
      onError: () => undefined,
    }),
    [dayNumber, gameId],
  );

  const guiltyVoters = Object.entries(verdicts)
    .filter(([uid, vote]) => vote === "guilty" && uid !== viewerUid && players[uid]?.alive)
    .map(([uid]) => uid);

  const choose = (targetUid: string) => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid || saving) return;
    const next = chosenUid === targetUid ? null : targetUid;
    setSaving(true);
    setError(false);
    applyAtomicUpdate({ [firebasePaths.gameJesterRevenge(gameId, dayNumber, uid)]: next })
      .then(() => setChosenUid(next))
      .catch(() => setError(true))
      .finally(() => setSaving(false));
  };
  const chooseRef = useRef(choose);
  useEffect(() => {
    chooseRef.current = choose;
  });

  const eligibleKey = guiltyVoters.join(",");
  useEffect(() => {
    onPickerChange({
      eligibleUids: eligibleKey ? eligibleKey.split(",") : [],
      selectedUids: chosenUid ? [chosenUid] : [],
      disabled: saving,
      toggle: (uid) => chooseRef.current(uid),
    });
    return () => onPickerChange(null);
  }, [eligibleKey, chosenUid, saving, onPickerChange]);

  return (
    <section aria-label="Vingança do Jester" className="panel-private mt-4 border-[#a33843]/60 bg-[#2a1517] text-left">
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0b9bd]/10 text-[#f0b9bd]"
        >
          <Crosshair className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[#fffaf0]">
            {chosenUid ? `Vingança: ${players[chosenUid]?.name ?? "?"}` : "Nenhum alvo escolhido"}
          </p>
          <p className="mt-0.5 text-sm leading-6 text-[#e6c3c6]">
            {guiltyVoters.length === 0
              ? "Ninguém vivo votou culpado. Não há vingança."
              : "Você foi enforcado. Escolha na lista quem votou culpado para morrer com você. Dá para trocar até o fim da noite."}
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
          Não foi possível salvar sua vingança.
        </p>
      )}
    </section>
  );
}
