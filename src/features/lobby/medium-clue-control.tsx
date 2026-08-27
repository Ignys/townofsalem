"use client";

import { useState } from "react";

import { createMediumClue } from "@/game-engine/medium-clue";
import { createRandomRecorder, createSeededRandomSource } from "@/game-engine/random";
import type { NightResolutionRecord, Player, RecordedMediumClue } from "@/types";

interface MediumClueControlProps {
  gameId: string;
  nightId: string;
  victimUid: string;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  resolutions: Readonly<Record<string, NightResolutionRecord>>;
  existingClue?: RecordedMediumClue;
  disabled: boolean;
  onRecord: (clue: RecordedMediumClue) => void;
}

function findVictimDeath(
  victimUid: string,
  resolutions: Readonly<Record<string, NightResolutionRecord>>,
) {
  return Object.values(resolutions)
    .filter(({ rolledBackAt }) => !rolledBackAt)
    .sort((left, right) => (right.appliedAt ?? right.createdAt) - (left.appliedAt ?? left.createdAt))
    .flatMap(({ resolution }) => resolution.deathRecords ?? [])
    .find(({ targetUid }) => targetUid === victimUid);
}

export function MediumClueControl({
  gameId,
  nightId,
  victimUid,
  players,
  assignments,
  resolutions,
  existingClue,
  disabled,
  onRecord,
}: MediumClueControlProps) {
  const death = findVictimDeath(victimUid, resolutions);
  const [candidateCount, setCandidateCount] = useState<2 | 3 | 4>(
    existingClue?.candidateCount ?? 2,
  );
  const [responsiblePlayerUid, setResponsiblePlayerUid] = useState(
    existingClue?.responsiblePlayerUid ?? death?.attackerUid ?? "",
  );
  const [recordedClue, setRecordedClue] = useState(existingClue);
  const [error, setError] = useState("");
  const responsibleCandidates = death?.cause === "mafia-attack"
    ? players.filter(({ uid }) => assignments[uid] && assignments[uid] !== "" && [
      "blackmailer", "consigliere", "godfather", "janitor", "mafioso",
    ].includes(assignments[uid]))
    : players;

  const generate = () => {
    if (!responsiblePlayerUid) {
      setError("Selecione manualmente o responsável por esta morte.");
      return;
    }
    try {
      const decisions: Array<{
        key: string;
        candidateUids: readonly string[];
        selectedUid: string;
      }> = [];
      const choose = createRandomRecorder(
        createSeededRandomSource(
          `${gameId}:${nightId}:medium:${victimUid}:${candidateCount}:${responsiblePlayerUid}`,
        ),
        decisions,
      );
      const clue = createMediumClue(
        victimUid,
        responsiblePlayerUid,
        players.map(({ uid }) => uid),
        candidateCount,
        choose,
      );
      setRecordedClue(clue);
      setError("");
      onRecord(clue);
    } catch {
      setError("Não há jogadores suficientes para gerar essa quantidade de candidatos.");
    }
  };

  return (
    <div className="ml-auto grid w-full gap-2 rounded-lg border border-white/10 bg-black/20 p-3 lg:w-auto lg:min-w-96">
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs text-zinc-300">
          Candidatos
          <select
            value={candidateCount}
            disabled={disabled}
            onChange={(event) => setCandidateCount(Number(event.target.value) as 2 | 3 | 4)}
            className="min-h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2"
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>
        <label className="grid min-w-44 flex-1 gap-1 text-xs text-zinc-300">
          Responsável confirmado
          <select
            value={responsiblePlayerUid}
            disabled={disabled || Boolean(death?.attackerUid)}
            onChange={(event) => setResponsiblePlayerUid(event.target.value)}
            className="min-h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2"
          >
            <option value="">Selecionar</option>
            {responsibleCandidates.map((player) => (
              <option key={player.uid} value={player.uid}>{player.name}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={disabled || !responsiblePlayerUid}
          onClick={generate}
          className="min-h-9 rounded-lg bg-[#7d2330] px-3 text-xs font-bold text-white disabled:opacity-50"
        >
          Sortear e registrar pista
        </button>
      </div>
      {recordedClue && (
        <p className="text-xs leading-5 text-[#f4dfbd]">
          Pista: {recordedClue.candidateUids
            .map((uid) => players.find((player) => player.uid === uid)?.name ?? uid)
            .join(", ")}.
        </p>
      )}
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
