"use client";

import { Skull, Smile } from "lucide-react";
import { useState } from "react";

import { RoleTag } from "@/features/game-state/player-status-board";
import type { GraveyardEntryRecord, VerdictOutcome, VerdictVote } from "@/lib/firebase/schema";

import { getForcedVerdict } from "@/game-engine/role-rules";
import { isPlayerEligibleForVerdict } from "@/game-engine/verdict-result";
import { DEFAULT_VERDICT_VOTING_SETTINGS } from "./voting-settings";
import { usePlayerVerdictVote } from "./use-player-verdict-vote";
import { saveVerdictVote } from "./voting-repository";

interface PlayerVerdictVotingProps {
  gameId: string;
  dayNumber: number;
  playerUid: string;
  playerAlive: boolean;
  accusedPlayerUid?: string | null;
  verdictClosedAt?: number | null;
  verdictOutcome?: VerdictOutcome | null;
  /** Role do próprio jogador: Peaceful/Spiteful Townie têm o voto definido pela carta. */
  roleId?: string;
  /** Nome de quem está sendo julgado, para a pergunta do cartão. */
  accusedName?: string;
  /** Lápide do acusado, para mostrar a role de quem foi enforcado. */
  accusedGrave?: GraveyardEntryRecord;
}

export function PlayerVerdictVoting(props: PlayerVerdictVotingProps) {
  const currentVote = usePlayerVerdictVote(props.gameId, props.dayNumber);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const eligible = isPlayerEligibleForVerdict(
    props.playerUid,
    props.playerAlive,
    props.accusedPlayerUid,
    DEFAULT_VERDICT_VOTING_SETTINGS,
  );

  // O voto é público, então a carta manda no botão: o que aparece é o que conta.
  const forcedVerdict = props.roleId ? getForcedVerdict(props.roleId) : null;

  const handleVote = async (vote: VerdictVote | null) => {
    setBusy(true);
    setError(false);
    try {
      await saveVerdictVote(props.gameId, props.dayNumber, vote);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (props.verdictClosedAt) {
    const name = props.accusedName ?? "O acusado";
    const grave = props.accusedGrave;
    return (
      <section aria-label="Resultado da votação" className="panel-public mt-4 text-center">
        <h2 className="font-serif text-xl font-semibold">
          {props.verdictOutcome === "guilty"
            ? `${name} foi enforcado`
            : props.verdictOutcome === "innocent"
              ? `${name} foi inocentado`
              : props.verdictOutcome === "tie"
                ? "Empate: ninguém foi enforcado"
                : "Resultado indisponível"}
        </h2>
        {props.verdictOutcome === "guilty" && grave && (
          <div className="mt-3 flex justify-center">
            {grave.cleaned || !grave.roleId ? (
              <span className="text-sm text-[#5b4d44]">A role não foi revelada.</span>
            ) : (
              <RoleTag roleId={grave.roleId} />
            )}
          </div>
        )}
      </section>
    );
  }

  if (!eligible) {
    if (props.playerAlive) return null;
    return <p className="panel-private mt-4 py-3 text-sm text-[#bdb7ad]">Jogadores mortos não votam no veredito.</p>;
  }

  const disabledFor = (vote: VerdictVote) =>
    busy || !currentVote.loaded || (forcedVerdict !== null && vote !== forcedVerdict);
  const choiceClass = (tone: string) =>
    `flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7d2330] disabled:cursor-not-allowed disabled:opacity-40 ${tone}`;

  return (
    <section className="panel-public mt-4">
      <h2 className="font-serif text-xl font-semibold">
        {props.accusedName ? `${props.accusedName} é culpado?` : "Seu veredito"}
      </h2>
      <p className="mt-1 text-sm text-[#5b4d44]">
        {forcedVerdict
          ? `Sua role sempre vota ${forcedVerdict === "guilty" ? "Culpado" : "Inocente"}.`
          : "Toque de novo para tirar seu voto. Quem não vota se abstém."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabledFor("guilty")}
          aria-pressed={currentVote.vote === "guilty"}
          onClick={() => void handleVote(currentVote.vote === "guilty" ? null : "guilty")}
          className={choiceClass(
            "border-[#7d2330]/40 bg-[#fffaf1] text-[#7d2330] hover:bg-[#7d2330]/8 aria-pressed:border-[#7d2330] aria-pressed:bg-[#7d2330] aria-pressed:text-white",
          )}
        >
          <Skull aria-hidden="true" className="size-5" />
          Culpado
        </button>
        <button
          type="button"
          disabled={disabledFor("innocent")}
          aria-pressed={currentVote.vote === "innocent"}
          onClick={() => void handleVote(currentVote.vote === "innocent" ? null : "innocent")}
          className={choiceClass(
            "border-[#3f6b48]/40 bg-[#fffaf1] text-[#2f5537] hover:bg-[#3f6b48]/8 aria-pressed:border-[#3f6b48] aria-pressed:bg-[#3f6b48] aria-pressed:text-white",
          )}
        >
          <Smile aria-hidden="true" className="size-5" />
          Inocente
        </button>
      </div>
      {(error || currentVote.error) && (
        <p role="alert" className="mt-3 text-sm text-[#7d2330]">Não foi possível registrar seu veredito.</p>
      )}
    </section>
  );
}
