"use client";

import { useState } from "react";

import type {
  PublicPlayerRecord,
  VerdictOutcome,
  VerdictVote,
} from "@/lib/firebase/schema";

import { closeVerdictVoting } from "./close-verdict-voting";
import { countVerdictVotes } from "@/game-engine/verdict-result";

const OUTCOME_LABELS: Record<VerdictOutcome, string> = {
  guilty: "Culpado",
  innocent: "Inocente",
  tie: "Empate — sem decisão",
};

interface HostVerdictSummaryProps {
  gameId: string;
  accused?: PublicPlayerRecord;
  accusedPlayerUid?: string | null;
  players: Record<string, PublicPlayerRecord>;
  verdicts?: Record<string, VerdictVote>;
  verdictClosedAt?: number | null;
  verdictOutcome?: VerdictOutcome | null;
}

export function HostVerdictSummary(props: HostVerdictSummaryProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const eligibleVoterUids = new Set(
    Object.entries(props.players)
      .filter(
        ([playerUid, player]) =>
          player.alive && playerUid !== props.accusedPlayerUid,
      )
      .map(([playerUid]) => playerUid),
  );
  const counts = countVerdictVotes(props.verdicts, eligibleVoterUids);

  const handleClose = async () => {
    if (!window.confirm("Encerrar a votação e registrar o resultado atual? Isso não executará ninguém automaticamente.")) {
      return;
    }
    setBusy(true);
    setError(false);
    try {
      await closeVerdictVoting(props.gameId);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5">
      <p className="text-sm text-[#bdb7ad]">Acusado: <strong className="text-[#fffaf0]">{props.accused?.name ?? "indisponível"}</strong></p>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <VerdictCount label="Culpado" value={counts.guilty} />
        <VerdictCount label="Inocente" value={counts.innocent} />
        <VerdictCount label="Abstenção" value={counts.abstain} />
      </dl>
      {props.verdictClosedAt ? (
        <p className="mt-4 rounded-xl border border-[#d3b88c]/25 bg-[#d3b88c]/10 px-4 py-3 font-bold text-[#fffaf0]">
          Resultado: {props.verdictOutcome ? OUTCOME_LABELS[props.verdictOutcome] : "indisponível"}. Nenhuma execução foi aplicada.
        </p>
      ) : (
        <button type="button" disabled={busy || !props.accused} onClick={() => void handleClose()} className="mt-4 min-h-11 w-full rounded-xl bg-[#d3b88c] px-4 font-black text-[#17191b] disabled:opacity-50">
          {busy ? "Encerrando…" : "Encerrar e calcular veredito"}
        </button>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-[#f0b9bd]">Não foi possível encerrar o veredito.</p>}
      <p className="mt-3 text-xs leading-5 text-[#8f8a82]">O acusado não vota. Empate gera “sem decisão”; abstenções não entram na comparação.</p>
    </div>
  );
}

function VerdictCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 px-2 py-3">
      <dt className="text-xs text-[#9f9990]">{label}</dt>
      <dd className="mt-1 text-xl font-black text-[#fffaf0]">{value}</dd>
    </div>
  );
}
