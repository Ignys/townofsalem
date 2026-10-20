"use client";

import type { GamePublicRecord, PublicPlayerRecord } from "@/lib/firebase/schema";

import { HostAccusationSummary } from "./host-accusation-summary";
import { HostVerdictSummary } from "./host-verdict-summary";
import { useHostDayVotes } from "./use-host-day-votes";
import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import { isAccusationPhase } from "./voting-phases";

interface HostVotingPanelProps {
  gameId: string;
  verifiedHostUid: string;
  game: GamePublicRecord;
  players: Record<string, PublicPlayerRecord>;
}

export function HostVotingPanel(props: HostVotingPanelProps) {
  const dayVotes = useHostDayVotes(props.gameId, props.game.day, props.verifiedHostUid);
  const privatePlayers = useHostRoleAssignments(props.gameId, props.verifiedHostUid);
  const gameVariants = useGameVariants(props.gameId);
  const votingPhase = isAccusationPhase(props.game.phase) || props.game.phase === "verdict";
  const hasAccused = Boolean(props.game.accusedPlayerUid) && ["trial", "defense"].includes(props.game.phase);

  if (!votingPhase && !hasAccused) {
    return null;
  }

  return (
    <section className="panel-private w-full">
      <p className="text-sm font-semibold text-[#f2c879]">Dia {props.game.day}</p>
      <h2 className="mt-1 font-serif text-2xl font-semibold text-[#fffaf0]">
        {isAccusationPhase(props.game.phase) ? "Acusações" : "Julgamento"}
      </h2>

      {!dayVotes.loaded || !privatePlayers.loaded || !gameVariants.loaded ? (
        <p className="mt-5 text-sm text-[#bdb7ad]">Carregando votos…</p>
      ) : dayVotes.error || privatePlayers.error || gameVariants.error ? (
        <p role="alert" className="mt-5 text-sm text-[#f0b9bd]">Não foi possível carregar os votos do host.</p>
      ) : isAccusationPhase(props.game.phase) ? (
        <HostAccusationSummary gameId={props.gameId} day={props.game.day} accusations={dayVotes.votes.accusations} players={props.players} privatePlayers={privatePlayers.assignments} variants={gameVariants.variants} />
      ) : props.game.phase === "verdict" ? (
        <HostVerdictSummary
          gameId={props.gameId}
          accused={props.game.accusedPlayerUid ? props.players[props.game.accusedPlayerUid] : undefined}
          accusedPlayerUid={props.game.accusedPlayerUid}
          players={props.players}
          verdicts={dayVotes.votes.verdicts}
          verdictClosedAt={props.game.verdictClosedAt}
          verdictOutcome={props.game.verdictOutcome}
          privatePlayers={privatePlayers.assignments}
          variants={gameVariants.variants}
        />
      ) : (
        <p className="mt-5 text-sm text-[#bdb7ad]">Acusado: <strong className="text-[#fffaf0]">{props.game.accusedPlayerUid ? props.players[props.game.accusedPlayerUid]?.name ?? "indisponível" : "indisponível"}</strong>. Interrompa a conversa e inicie a fase <strong className="text-[#fffaf0]">Defesa</strong> (30s), depois <strong className="text-[#fffaf0]">Veredito</strong>.</p>
      )}
    </section>
  );
}
