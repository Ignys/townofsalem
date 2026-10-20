"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NightResolutionMessage } from "@/features/night-actions/night-resolution-message";
import {
  observeAuthenticatedPlayerDawnResults,
  observeAuthenticatedPlayerInstantResults,
  observeAuthenticatedPlayerNightActions,
  observeDayAnnouncements,
} from "@/lib/firebase/realtime-database-repository";
import type { GraveyardEntryRecord, PublicPlayerRecord } from "@/lib/firebase/schema";
import type {
  DayAnnouncementRecord,
  PlayerDawnNightResultRecord,
  PlayerInstantNightResultRecord,
  PlayerNightActionSubmission,
} from "@/types";

import { describeGraveyardDeath } from "./graveyard-entry";
import { getPlayerDossier } from "./player-dossier";
import { RoleTag } from "./player-status-board";

interface PlayerDetailsDialogProps {
  gameId: string;
  targetUid: string;
  viewerUid: string;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  graveyard?: Readonly<Record<string, GraveyardEntryRecord>>;
  mayorReveals?: Readonly<Record<string, number>>;
  /** Equipe da Máfia, para quem é da Máfia: a role dos parceiros aparece no cabeçalho. */
  mafiaTeam?: Readonly<Record<string, { roleId: string }>>;
  currentNightId?: string | null;
  /** Anúncios e resultados do amanhecer só podem ser lidos fora da noite. */
  revealed: boolean;
  onClose: () => void;
}

type Submissions = Record<string, Record<string, PlayerNightActionSubmission>>;

function useDossierSources(gameId: string, revealed: boolean, currentNightId?: string | null) {
  const [announcements, setAnnouncements] = useState<Record<string, DayAnnouncementRecord>>({});
  const [dawnResults, setDawnResults] = useState<Record<string, PlayerDawnNightResultRecord>>({});
  const [instantResults, setInstantResults] = useState<
    Record<string, Record<string, PlayerInstantNightResultRecord>>
  >({});
  const [submissions, setSubmissions] = useState<Submissions>({});

  useEffect(
    () => observeAuthenticatedPlayerInstantResults(gameId, {
      onData: (value) => setInstantResults(value ?? {}),
      onError: () => setInstantResults({}),
    }),
    [gameId],
  );

  useEffect(() => {
    if (!revealed) return;
    const stopAnnouncements = observeDayAnnouncements(gameId, {
      onData: (value) => setAnnouncements(value ?? {}),
      onError: () => setAnnouncements({}),
    });
    const stopDawn = observeAuthenticatedPlayerDawnResults(gameId, {
      onData: (value) => setDawnResults(value ?? {}),
      onError: () => setDawnResults({}),
    });
    return () => {
      stopAnnouncements();
      stopDawn();
    };
  }, [gameId, revealed]);

  // O jogador não lista as noites; conhece as que aparecem nos anúncios e nos próprios resultados.
  const nightIds = [
    ...new Set([
      ...Object.keys(announcements),
      ...Object.keys(dawnResults),
      ...Object.keys(instantResults),
      ...(currentNightId ? [currentNightId] : []),
    ]),
  ].sort();
  const nightIdsKey = nightIds.join("|");

  useEffect(() => {
    const stops = (nightIdsKey ? nightIdsKey.split("|") : []).map((nightId) =>
      observeAuthenticatedPlayerNightActions(gameId, nightId, {
        onData: (value) => setSubmissions((current) => ({ ...current, [nightId]: value ?? {} })),
        onError: () => undefined,
      }),
    );
    return () => stops.forEach((stop) => stop());
  }, [gameId, nightIdsKey]);

  const nightNumberById = Object.fromEntries([
    ...Object.entries(instantResults).flatMap(([nightId, results]) =>
      Object.values(results).slice(0, 1).map((result) => [nightId, result.nightNumber]),
    ),
    ...Object.entries(dawnResults).map(([nightId, record]) => [nightId, record.nightNumber]),
    ...Object.entries(announcements).map(([nightId, record]) => [nightId, record.nightNumber]),
  ]);

  return { announcements, dawnResults, instantResults, submissions, nightNumberById };
}

function useNotes(gameId: string, targetUid: string) {
  const key = `tos-notes:${gameId}:${targetUid}`;
  const [notes, setNotes] = useState(() => {
    try {
      return window.localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  });

  const update = (value: string) => {
    setNotes(value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Sem armazenamento: a anotação vale só enquanto o modal está aberto.
    }
  };

  return [notes, update] as const;
}


export function PlayerDetailsDialog({
  gameId,
  targetUid,
  viewerUid,
  players,
  graveyard,
  mayorReveals,
  mafiaTeam,
  currentNightId,
  revealed,
  onClose,
}: PlayerDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"history" | "notes">("history");
  const sources = useDossierSources(gameId, revealed, currentNightId);
  const [notes, setNotes] = useNotes(gameId, targetUid);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const player = players[targetUid];
  const grave = graveyard?.[targetUid];
  const death = grave ? describeGraveyardDeath(grave) : null;
  const revealDay = mayorReveals?.[targetUid];
  const playerNames = Object.fromEntries(Object.entries(players).map(([uid, { name }]) => [uid, name]));
  const entries = getPlayerDossier({ targetUid, playerNames, ...sources });
  const byNight = Map.groupBy(entries, ({ nightNumber }) => nightNumber);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      aria-labelledby="player-details-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#e0cfb4] bg-[#f4ead9] p-0 text-[#251f1d] shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop:bg-black/70"
    >
      <div className="flex max-h-[80svh] flex-col">
        <header className="flex items-start gap-3 border-b border-[#d8c8b0] p-5 pb-4">
          <span
            title="Assento"
            className={`flex size-9 shrink-0 items-center justify-center rounded-full font-bold tabular-nums ${
              targetUid === viewerUid ? "bg-[#7d2330] text-[#fffaf0]" : "bg-[#e4d6bf] text-[#3b2a22]"
            }`}
          >
            {player?.seat ?? "–"}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="player-details-title" className="truncate font-serif text-2xl font-semibold">
              {player?.name ?? "Jogador removido"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className={`font-semibold ${player?.alive === false ? "text-[#7d2330]" : "text-[#3f6b48]"}`}>
                {player?.alive === false ? "Morto" : "Vivo"}
                {targetUid === viewerUid ? ", você" : ""}
              </span>
              {player?.alive === false && grave ? (
                grave.cleaned || !grave.roleId ? (
                  <span className="rounded-md border border-[#c9b89f] px-2 py-0.5 text-[0.6875rem] font-medium text-[#75685f] uppercase">
                    corpo limpo
                  </span>
                ) : (
                  <RoleTag roleId={grave.roleId} />
                )
              ) : player?.alive && mafiaTeam?.[targetUid] ? (
                <RoleTag roleId={mafiaTeam[targetUid].roleId} />
              ) : player?.alive && mayorReveals?.[targetUid] ? (
                <RoleTag roleId="mayor" />
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-[#5b4d44] hover:bg-[#e4d6bf] focus-visible:outline-3 focus-visible:outline-[#7d2330]"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div role="tablist" aria-label="Detalhes do jogador" className="flex gap-1 px-5 pt-3">
          {(["history", "notes"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className="min-h-10 rounded-lg px-4 text-sm font-bold text-[#5b4d44] aria-selected:bg-[#7d2330] aria-selected:text-white focus-visible:outline-3 focus-visible:outline-[#7d2330]"
            >
              {value === "history" ? "Histórico" : "Anotações"}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="overflow-y-auto p-5 pt-4">
          {tab === "history" ? (
            <>
              {/* Revelações antigas guardavam um horário, não o dia. */}
              {revealDay !== undefined && revealDay < 1000 && (
                <p className="mb-2 border-l-4 border-[#3f6b48] bg-[#3f6b48]/8 py-2 pr-3 pl-3 text-sm font-semibold text-[#264a2f]">
                  Revelou-se como Mayor no Dia {revealDay}
                </p>
              )}

              {player?.alive === false && death?.cause && (
                <p className="mb-4 border-l-4 border-[#7d2330] bg-[#7d2330]/8 py-2 pr-3 pl-3 text-sm font-semibold text-[#5a1822]">
                  {death.cause}
                  {death.when ? ` ${death.when.startsWith("Noite") ? "na" : "no"} ${death.when}` : ""}
                </p>
              )}

              {byNight.size > 0 && (
                // Log em linha do tempo: ponto vinho = público, azul-noite = só você sabe.
                <ol className="relative ml-1.5 border-l border-[#cdbb9f] pl-4">
                  {[...byNight].map(([nightNumber, nightEntries]) => (
                    <li key={nightNumber} className="pb-3 last:pb-0">
                      <h3 className="relative -ml-4 flex items-center gap-2 pb-1 text-xs font-bold text-[#75685f]">
                        <span aria-hidden="true" className="-ml-[3.5px] size-1.5 rounded-full bg-[#b9a994]" />
                        Noite {nightNumber}
                      </h3>
                      <ul className="grid gap-1.5">
                        {nightEntries.map((entry) => (
                          <li
                            key={entry.key}
                            className={`relative rounded-r-md border-l-4 py-1.5 pr-2 pl-2.5 text-sm leading-6 ${
                              entry.visibility === "private"
                                ? "border-[#34405e] bg-[#34405e]/8"
                                : "border-[#7d2330] bg-[#7d2330]/6"
                            }`}
                          >
                            <NightResolutionMessage line={entry.line} light />
                            {entry.visibility === "private" && (
                              <span className="ml-1.5 text-[0.6875rem] font-semibold text-[#34405e]">só você</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <>
              <label htmlFor="player-notes" className="text-sm font-semibold">
                Suas anotações sobre {player?.name ?? "este jogador"}
              </label>
              <textarea
                id="player-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={8}
                placeholder="Ex.: disse ser Sheriff na noite 1, votou culpado no julgamento da Ana…"
                className="mt-2 w-full resize-y rounded-xl border border-[#b9a994] bg-[#fffaf1] px-4 py-3 text-base outline-none placeholder:text-[#a99c8c] focus:border-[#7d2330] focus:ring-3 focus:ring-[#7d2330]/15"
              />
              <p className="mt-1 text-xs text-[#75685f]">Salvas só neste aparelho. Ninguém mais vê.</p>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
