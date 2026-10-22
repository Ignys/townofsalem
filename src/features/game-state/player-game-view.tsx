"use client";

import dynamic from "next/dynamic";
import { Moon, Skull, Sun } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { getRoleById } from "@/data/roles";
import { getChosenExecutionTarget } from "@/game-engine/role-rules";
import { useAnnouncementSounds } from "@/features/game-state/announcement-sounds";
import { DawnReadyMeter } from "@/features/game-state/dawn-ready-meter";
import { PlayerDawnReady } from "@/features/game-state/player-dawn-ready";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import { tallyMafiaKill } from "@/features/mafia/mafia-kill-projection";
import { VAMPIRE_COOLDOWN_STATUS } from "@/game-engine/resolve-night";
import { MafiaTeamPanel, teamKillActionId, useMafiaBoard, useMafiaTeam } from "@/features/mafia/mafia-team-panel";
import type { NightTargetPicker } from "@/features/night-actions/night-target-picker";
import { PlayerNightActionPanel } from "@/features/night-actions/player-night-action-panel";
import {
  PlayerDawnNightResults,
} from "@/features/night-actions/player-night-results-cards";
import { GameTimerDisplay } from "@/features/timer/game-timer-display";
import { AccusationTallyBoard } from "@/features/voting/accusation-tally-board";
import { getAccusationVotesRequired } from "@/features/voting/accusation-threshold";
import { useAccusationVoting } from "@/features/voting/use-accusation-voting";
import { usePublicAccusations } from "@/features/voting/use-public-accusations";
import { PlayerVerdictVoting } from "@/features/voting/player-verdict-voting";
import { PlayerJesterRevenge } from "@/features/voting/player-jester-revenge";
import { VerdictVotesBoard } from "@/features/voting/verdict-votes-board";
import { isAccusationPhase } from "@/features/voting/voting-phases";
import { isHostlessGame, type GamePublicRecord, type PublicPlayerRecord } from "@/lib/firebase/schema";
import type { NightTeam, Player } from "@/types";

import { getPlayerEntries } from "./player-roster";

import { GameOverCard } from "./game-over-card";
import { PhaseSky } from "./phase-sky";
import { GAME_PHASE_LABELS } from "./game-phase-presentation";
import { useSessionSyncKey } from "./use-session-sync";

const SessionSyncSheet = dynamic(() => import("./session-sync-sheet"), {
  ssr: false,
});
import { RolesGuideButton } from "@/features/roles/roles-guide-button";
import { PlayerRoleHoldButton } from "./player-role-hold-button";
import { PlayerRoleNotice } from "./player-role-notice";
import { PlayerDetailsDialog } from "./player-details-dialog";
import { GuideSection } from "./player-role-guide";
import { PlayerStatusBoard, RoleTag } from "./player-status-board";
import { GameCompositionBoard } from "./game-composition-board";
import { PlayerMayorReveal } from "./player-mayor-reveal";
import { useGraveyard } from "./use-graveyard";
import { useMayorReveals } from "./use-mayor-reveals";
import { usePrivatePlayerRole } from "./use-private-player-role";

interface PlayerGameViewProps {
  gameId: string;
  code: string;
  game: GamePublicRecord;
  alive: boolean;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  viewerUid: string;
  /** Botão extra ao lado de "Ver roles do jogo" (controles de emergência do modo só celulares). */
  footerAction?: ReactNode;
}

// O número fica ao lado do ícone; o título mostra só o nome da fase.
function formatCycle(game: GamePublicRecord): string | null {
  if (game.phase === "night") return game.nightNumber ? `Noite ${game.nightNumber}` : null;
  return game.day ? `Dia ${game.day}` : null;
}

export function PlayerGameView({
  gameId,
  code,
  game,
  alive,
  players,
  viewerUid,
  footerAction,
}: PlayerGameViewProps) {
  const privateRole = usePrivatePlayerRole(gameId);
  const gameVariants = useGameVariants(gameId);
  useAnnouncementSounds(game, gameVariants.variants.announcementSounds, "players");
  const { graveyard } = useGraveyard(gameId);
  const mayorReveals = useMayorReveals(gameId);
  const accusationVoting = useAccusationVoting(gameId, game.day);
  const { accusations } = usePublicAccusations(gameId, game.day);
  // Máfia e Vampiros acordam em grupo e se veem; os outros não leem nada disso.
  const nightTeam: NightTeam | null = privateRole.privatePlayer?.roleId === "vampire"
    ? "vampire"
    : privateRole.privatePlayer?.faction === "mafia" ? "mafia" : null;
  const mafiaTeam = useMafiaTeam(gameId, nightTeam);
  const mafiaBoard = useMafiaBoard(
    gameId,
    nightTeam && game.phase === "night" ? game.currentNightId : null,
    nightTeam ?? "mafia",
  );
  const syncKey = useSessionSyncKey();
  const [syncOpen, setSyncOpen] = useState(false);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);
  const [nightPicker, setNightPicker] = useState<NightTargetPicker | null>(null);
  const holdTimer = useRef<number | null>(null);
  const cancelHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };
  const holdHandlers = syncKey
    ? {
        onPointerDown: () => {
          cancelHold();
          holdTimer.current = window.setTimeout(() => setSyncOpen(true), 800);
        },
        onPointerUp: cancelHold,
        onPointerLeave: cancelHold,
        onPointerCancel: cancelHold,
        onContextMenu: (event: { preventDefault: () => void }) =>
          event.preventDefault(),
      }
    : {};

  if (!privateRole.loaded || !gameVariants.loaded) {
    return <PlayerRoleNotice loading message="Carregando sua informação privada…" />;
  }

  if (privateRole.error || gameVariants.error) {
    return (
      <PlayerRoleNotice message="Não foi possível carregar sua role e as regras da partida com segurança. Tente novamente ou avise o mestre." />
    );
  }

  if (!privateRole.privatePlayer) {
    return (
      <PlayerRoleNotice
        loading
        message="Sua role ainda não está disponível. Aguarde o mestre concluir o sorteio."
      />
    );
  }

  const role = getRoleById(privateRole.privatePlayer.roleId);
  const playerCount = gameVariants.roleCount ?? Object.keys(players).length;

  if (!role || role.faction !== privateRole.privatePlayer.faction) {
    return (
      <PlayerRoleNotice message="Sua role não pôde ser reconhecida. Avise o mestre para revisar a partida." />
    );
  }

  const isNight = game.phase === "night";
  const roster: Player[] = getPlayerEntries(players).map(([uid, player]) => ({
    id: uid,
    uid,
    ...player,
    // A revelação do Mayor é pública; o resto dos status dos outros não chega aqui.
    ...(mayorReveals[uid] ? { statuses: [{ type: "mayor-revealed" }] } : {}),
  }));
  const viewer = roster.find((player) => player.uid === viewerUid);
  // Sem mestre, o "dia" é a preparação: só se lê o que aconteceu na noite.
  const dawn = isHostlessGame(game) && game.phase === "day";
  const accusing = isAccusationPhase(game.phase) && !dawn && !game.accusedPlayerUid;
  // O status vive só nos dados privados do próprio jogador: ninguém mais vê o aviso.
  const silenced = Boolean(privateRole.privatePlayer.statuses?.blackmailed);
  const blackmailed = silenced && gameVariants.variants.blackmailedCannotVote;
  // Segredos que não ficam expostos na tela: só aparecem segurando o botão da role.
  const mafiaPartnerUids = Object.keys(mafiaTeam).filter((uid) => uid !== viewerUid);
  const executionTargetUid = getChosenExecutionTarget(Object.keys(privateRole.privatePlayer.statuses ?? {}));
  const holdSecrets = mafiaPartnerUids.length > 0 || (role.id === "executioner" && executionTargetUid) ? (
    <>
      {mafiaPartnerUids.length > 0 && (
        <GuideSection title={nightTeam === "vampire" ? "Seus Vampiros" : "Sua Máfia"}>
          <ul className="grid gap-1.5">
            {mafiaPartnerUids.map((uid) => (
              <li key={uid} className="flex items-center gap-2">
                <span className={`min-w-0 flex-1 truncate font-semibold ${players[uid]?.alive === false ? "text-[#8f8a82] line-through" : ""}`}>
                  {players[uid]?.name ?? "?"}
                </span>
                <RoleTag roleId={mafiaTeam[uid].roleId} />
              </li>
            ))}
          </ul>
        </GuideSection>
      )}
      {role.id === "executioner" && executionTargetUid && (
        <GuideSection title="Seu alvo">
          <p className="font-semibold">{players[executionTargetUid]?.name ?? "?"}</p>
        </GuideSection>
      )}
    </>
  ) : null;

  // Fim de jogo: só o resultado. As fases, listas e votações já não importam.
  if (game.status === "finished") {
    return (
      <div className="w-full max-w-md pb-8">
        <GameOverCard game={game} players={players} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md pb-32">
      {syncKey && syncOpen ? (
        <SessionSyncSheet
          syncKey={syncKey}
          code={code}
          onClose={() => setSyncOpen(false)}
        />
      ) : null}
      <PhaseSky night={isNight} className="p-6 text-center">
        <div>
          <div
            className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              isNight ? "text-[#c9d4ef]" : "text-[#f2c879]"
            }`}
          >
            {isNight ? (
              <Moon aria-hidden="true" className="size-6" />
            ) : (
              <Sun aria-hidden="true" className="size-6" />
            )}
            {formatCycle(game)}
          </div>
          <h1
            {...holdHandlers}
            className="mt-2 font-serif text-4xl font-semibold tracking-[-0.02em] text-[#fffaf0] select-none"
          >
            {game.phaseLabel ?? GAME_PHASE_LABELS[game.phase]}
          </h1>

        <div className="mt-5">
          {/* Só o timer: o que acontece na fase aparece nos cartões abaixo. */}
          {dawn && game.day ? (
            <DawnReadyMeter gameId={gameId} day={game.day} players={players} />
          ) : (
            (game.phase !== "trial" || isHostlessGame(game)) && <GameTimerDisplay game={game} />
          )}
          </div>
        </div>
      </PhaseSky>

      {nightTeam && game.status === "in-progress" && isNight && (
        <MafiaTeamPanel
          nightTeam={nightTeam}
          resting={Boolean(privateRole.privatePlayer.statuses?.[VAMPIRE_COOLDOWN_STATUS])}
          gameId={gameId}
          viewerUid={viewerUid}
          viewerAlive={alive}
          nightId={isNight ? game.currentNightId : null}
          players={players}
          team={mafiaTeam}
          board={mafiaBoard}
        />
      )}

      {isNight && viewer && (
        <PlayerNightActionPanel
          gameId={gameId}
          nightId={game.currentNightId}
          nightNumber={game.nightNumber}
          viewer={{ ...viewer, statuses: Object.values(privateRole.privatePlayer.statuses ?? {}) }}
          roleId={privateRole.privatePlayer.roleId}
          players={roster}
          variants={gameVariants.variants}
          playerCount={playerCount}
          resourceUses={privateRole.privatePlayer.resourceUses}
          fastTrack={isHostlessGame(game) && game.gamePace === "fast"}
          teamUids={Object.keys(mafiaTeam)}
          amnesiacRolePool={gameVariants.amnesiacRolePool}
          onPickerChange={setNightPicker}
          hostless={isHostlessGame(game)}
        />
      )}
      <PlayerDawnNightResults gameId={gameId} revealed={!isNight && game.phase !== "lobby"} />
      {dawn && alive && game.day ? <PlayerDawnReady gameId={gameId} day={game.day} viewerUid={viewerUid} /> : null}

      {!alive && (
        <section aria-label="Você está morto" className="panel-private mt-4 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-[#bdb7ad]"
          >
            <Skull className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold text-[#fffaf0]">Você está morto</p>
            <p className="text-sm leading-6 text-[#a9a297]">
              Continue acompanhando a partida, mas sem falar sobre o jogo.
            </p>
          </div>
        </section>
      )}

      {silenced && alive && !isNight && game.status === "in-progress" && (
        <section
          role="alert"
          aria-label="Você foi chantageado"
          className="panel-private mt-4 border-[#a33843]/60 bg-[#2a1517] text-center"
        >
          <h2 className="font-serif text-xl font-semibold text-[#fffaf0]">Você foi chantageado</h2>
          <p className="mt-1 text-sm leading-6 text-[#f0b9bd]">
            Você não pode falar hoje{blackmailed ? " nem votar" : ""}. Fique em silêncio até a noite.
          </p>
        </section>
      )}

      {role.id === "mayor" && alive && !isNight && game.status === "in-progress" && !mayorReveals[viewerUid] && (
        <PlayerMayorReveal gameId={gameId} day={game.day} />
      )}

      {accusing && (
        <>
          {blackmailed && (
            <p className="panel-private mt-4 py-3 text-sm text-[#bdb7ad]">
              Você está silenciado hoje — seu voto não será contado.
            </p>
          )}
          <div className="mt-4">
            <AccusationTallyBoard gameId={gameId} dayNumber={game.day} players={players} />
          </div>
        </>
      )}

      {game.phase === "verdict" && (
        blackmailed && !game.verdictClosedAt ? (
          <p className="panel-private mt-4 py-3 text-sm text-[#bdb7ad]">
            Você está silenciado hoje — seu voto não será contado.
          </p>
        ) : (
          <PlayerVerdictVoting
            accusedName={game.accusedPlayerUid ? players[game.accusedPlayerUid]?.name : undefined}
            accusedGrave={game.accusedPlayerUid ? graveyard[game.accusedPlayerUid] : undefined}
            gameId={gameId}
            dayNumber={game.day}
            playerUid={viewerUid}
            playerAlive={alive}
            accusedPlayerUid={game.accusedPlayerUid}
            verdictClosedAt={game.verdictClosedAt}
            verdictOutcome={game.verdictOutcome}
            roleId={privateRole.privatePlayer.roleId}
          />
        )
      )}
      {isNight
        && privateRole.privatePlayer.statuses?.["jester-revenge-pending"] && (
        <PlayerJesterRevenge
          gameId={gameId}
          dayNumber={game.day}
          viewerUid={viewerUid}
          players={players}
          onPickerChange={setNightPicker}
        />
      )}
      {game.phase === "verdict" && (
        <div className="mt-4">
          <VerdictVotesBoard
            gameId={gameId}
            dayNumber={game.day}
            players={players}
            accusedUid={game.accusedPlayerUid}
            closed={Boolean(game.verdictClosedAt)}
          />
        </div>
      )}

      <div className="mt-4">
        <PlayerStatusBoard
          players={players}
          viewerUid={viewerUid}
          graveyard={graveyard}
          mayorReveals={mayorReveals}
          onSelectPlayer={setSelectedPlayerUid}
          nightPick={isNight ? nightPicker ?? undefined : undefined}
          nightMarkTeam={nightTeam ?? undefined}
          nightMarks={
            isNight
              ? Object.fromEntries(
                  Object.entries(tallyMafiaKill(mafiaBoard, mafiaTeam, teamKillActionId(nightTeam ?? "mafia")).votesByTarget).map(([uid, votes]) => [uid, votes.length]),
                )
              : undefined
          }
          accusation={
            accusing && alive && !blackmailed
              ? {
                  vote: accusationVoting.vote,
                  disabled: accusationVoting.disabled,
                  failed: accusationVoting.failed,
                  // Como no placar: só contam votos de vivos em vivos.
                  counts: Object.entries(accusations)
                    .filter(([voterUid, targetUid]) => players[voterUid]?.alive && players[targetUid]?.alive)
                    .reduce<Record<string, number>>((counts, [, targetUid]) => {
                      counts[targetUid] = (counts[targetUid] ?? 0) + 1;
                      return counts;
                    }, {}),
                  required: getAccusationVotesRequired(players),
                  onAccuse: (uid) => void accusationVoting.accuse(uid),
                }
              : undefined
          }
        />
        {selectedPlayerUid && (
          <PlayerDetailsDialog
            key={selectedPlayerUid}
            gameId={gameId}
            targetUid={selectedPlayerUid}
            viewerUid={viewerUid}
            players={players}
            graveyard={graveyard}
            mayorReveals={mayorReveals}
            mafiaTeam={mafiaTeam}
            currentNightId={game.currentNightId}
            revealed={!isNight && game.phase !== "lobby"}
            onClose={() => setSelectedPlayerUid(null)}
          />
        )}
      </div>

      <div className="mt-4">
        <GameCompositionBoard roleComposition={gameVariants.roleComposition} />
      </div>

      <PlayerRoleHoldButton
        role={role}
        variants={gameVariants.variants}
        playerCount={playerCount}
        secrets={holdSecrets}
      />

      <div className="flex flex-wrap items-start justify-center gap-x-2">
        <RolesGuideButton
          roleComposition={gameVariants.roleComposition}
          randomRoleExclusions={gameVariants.randomRoleExclusions}
        />
        {footerAction}
      </div>
    </div>
  );
}
