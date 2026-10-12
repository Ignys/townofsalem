"use client";

import { useState } from "react";

import type {
  PublicPlayerRecord,
  VerdictOutcome,
  VerdictVote,
} from "@/lib/firebase/schema";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";
import type { GameVariants } from "@/game-engine/variants";
import { getEffectiveVerdicts, getEligibleVoterUids, getVoterWeights } from "./voter-rules";

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
  privatePlayers: Record<string, PrivatePlayerRecord>;
  variants: GameVariants;
}

export function HostVerdictSummary(props: HostVerdictSummaryProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  // O linchamento em si é aplicado no painel de Resolução do dia; aqui só sinalizamos
  // quando o condenado já morreu.
  const resolutionApplied = !props.accused?.alive;
  const eligibleVoterUids = getEligibleVoterUids(
    props.players,
    props.privatePlayers,
    props.variants,
    props.accusedPlayerUid,
  );
  const effectiveVerdicts = getEffectiveVerdicts(props.verdicts, props.privatePlayers);
  const counts = countVerdictVotes(
    effectiveVerdicts,
    eligibleVoterUids,
    getVoterWeights(props.privatePlayers, Object.keys(props.players).length),
  );

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
        <div className="mt-4 grid gap-3 rounded-xl border border-[#d3b88c]/25 bg-[#d3b88c]/10 px-4 py-3">
          <p className="font-bold text-[#fffaf0]">
            Resultado: {props.verdictOutcome ? OUTCOME_LABELS[props.verdictOutcome] : "indisponível"}.
          </p>
          {props.verdictOutcome === "guilty" && !resolutionApplied && (
            <>
              <p className="text-sm text-[#f4dfbd]">
                O linchamento é aplicado na Resolução do dia, já preenchida com o condenado —
                é lá que a lápide, a vingança do Jester e a decisão do Executioner são tratadas.
              </p>
              <button
                type="button"
                onClick={() => {
                  document
                    .querySelector("#host-day-workspace")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="min-h-10 rounded-lg bg-[#7d2330] px-4 font-bold text-white"
              >
                Aplicar linchamento
              </button>
            </>
          )}
          {resolutionApplied && <p className="text-sm text-[#bfe0c5]">Linchamento e efeitos associados aplicados.</p>}
        </div>
      ) : (
        <button type="button" disabled={busy || !props.accused} onClick={() => void handleClose()} className="mt-4 min-h-11 w-full rounded-xl bg-[#d3b88c] px-4 font-black text-[#17191b] disabled:opacity-50">
          {busy ? "Encerrando…" : "Encerrar e calcular veredito"}
        </button>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-[#f0b9bd]">Não foi possível encerrar o veredito.</p>}
      <p className="mt-3 text-xs leading-5 text-[#8f8a82]">O acusado não vota. Empate gera “sem decisão”; abstenções não entram na comparação. Peaceful Townie é contado como Innocent e Spiteful Townie como Guilty.</p>
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
