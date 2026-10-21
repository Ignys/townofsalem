"use client";

import { BookOpen, Crosshair, Moon, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";
import { getRoleResourceLimit } from "@/game-engine/role-resource-limits";
import type { GameVariants } from "@/game-engine/variants";
import type { Player } from "@/types";

import type { NightTargetPicker } from "./night-target-picker";
import { RESOURCE_BY_ROLE } from "./night-readiness";
import { PlayerNightPass } from "./player-night-pass";
import { getPlayerNightInteractions } from "./player-night-interactions";
import { PlayerNightActionRow } from "./player-night-action-row";
import { usePlayerNightSubmissions } from "./use-player-night-submissions";

interface PlayerNightActionPanelProps {
  gameId: string;
  nightId?: string | null;
  nightNumber: number | undefined;
  viewer: Player;
  roleId: string;
  players: readonly Player[];
  variants: GameVariants;
  playerCount: number;
  resourceUses?: Readonly<Record<string, number>>;
  /** Ritmo rápido: oferece "Estou pronto" para a noite acabar antes do timer. */
  fastTrack?: boolean;
  /** Parceiros da Máfia: não aparecem como alvo. */
  teamUids?: readonly string[];
  /** Roles que o Amnesiac pode lembrar na noite 3. */
  amnesiacRolePool?: readonly string[];
  /** Sem mestre: não manda aguardar o mestre. */
  hostless?: boolean;
  /** Avisa qual ação está usando a lista de jogadores para escolher alvos. */
  onPickerChange?: (picker: NightTargetPicker | null) => void;
}

export function PlayerNightActionPanel({
  gameId,
  nightId,
  nightNumber,
  viewer,
  roleId,
  players,
  variants,
  playerCount,
  resourceUses,
  fastTrack = false,
  teamUids = [],
  amnesiacRolePool = [],
  hostless = false,
  onPickerChange,
}: PlayerNightActionPanelProps) {
  const { submissions, loaded, error } = usePlayerNightSubmissions(gameId, nightId);
  const [chosenActiveId, setChosenActiveId] = useState<string | null>(null);
  const interactions = nightId && nightNumber
    ? getPlayerNightInteractions(viewer, roleId, ROLE_DEFINITIONS, nightNumber, variants)
    : [];

  if (!nightId || !nightNumber || !viewer.alive || interactions.length === 0) {
    if (hostless) return null;
    return (
      <p className="panel-private mt-4 text-sm leading-6 text-[#a9b3cc]">
        A noite está em andamento. Aguarde o mestre chamar sua role.
      </p>
    );
  }

  if (!loaded) {
    return <p className="panel-private mt-4 text-sm text-[#a9b3cc]">Carregando suas ações…</p>;
  }

  const limit = getRoleResourceLimit(roleId, playerCount);
  const usedResource = resourceUses?.[RESOURCE_BY_ROLE[roleId] ?? roleId] ?? 0;
  const exhausted = roleId !== "janitor" && limit !== null && usedResource >= limit;
  // A lista sempre escolhe alvos (por padrão para a primeira ação), mesmo depois de escolher:
  // o jogador troca quantas vezes quiser e vale o último alvo quando a noite acaba.
  const activeId = chosenActiveId ?? interactions[0]?.id;
  const activeInteraction = interactions.find(({ id }) => id === activeId);
  // A escolha salva da ação em foco, para o jogador ver sem procurar na lista.
  const activeTargets = activeInteraction && activeInteraction.action.targetCount > 0
    ? (submissions[activeInteraction.action.id]?.targetUids ?? []).map(
        (uid) => players.find((player) => player.uid === uid)?.name ?? "?",
      )
    : null;
  const activeSubmission = activeInteraction ? submissions[activeInteraction.action.id] : undefined;
  // Roles sem alvo de verdade ganham um cartão próprio em vez de "Alvo: …".
  const veteranAlert = roleId === "veteran" ? Boolean(activeSubmission) : null;
  const amnesiac = roleId === "amnesiac" && activeInteraction?.action.id === "remember-role";
  const rememberedRole = activeSubmission?.chosenRoleId ? getRoleById(activeSubmission.chosenRoleId) : undefined;
  const announcedNote = variants.amnesiacRoleAnnounced
    ? " Todos vão saber qual role você lembrou, mas não que foi você."
    : "";
  const werewolf = activeInteraction?.action.targetRelation === "adjacent-pair";
  const [primaryName, neighborName] = activeTargets ?? [];
  const card = werewolf
    ? {
        title: "Lua cheia",
        body: !primaryName
          ? "Esta noite você se transforma e ataca dois vizinhos. Escolha o alvo principal na lista."
          : !neighborName
            ? `Alvo principal: ${primaryName}. Agora escolha um vizinho para ser o segundo alvo.`
            : `Você vai atacar ${primaryName} e ${neighborName}. Dá para trocar até o fim da noite.`,
      }
    : veteranAlert !== null
    ? {
        title: veteranAlert ? "Alerta ligado" : "Alerta desligado",
        body: `${veteranAlert
          ? "Você vai atacar qualquer um que te visitar esta noite, inclusive aliados."
          : "Ligue o alerta para atacar qualquer um que te visitar esta noite, inclusive aliados."} Dá para mudar até o fim da noite.`,
      }
    : amnesiac && variants.amnesiacPicksRole
      ? {
          title: rememberedRole ? `Você vai lembrar: ${rememberedRole.name}` : "Escolha quem você era",
          body: `Ao amanhecer você vira essa role, com a facção e o objetivo dela.${announcedNote} Dá para trocar até o fim da noite.`,
        }
      : amnesiac
        ? {
            title: activeSubmission ? "Você vai lembrar uma role" : "Lembre quem você era",
            body: `Ao amanhecer você recebe por sorteio uma das roles abaixo e passa a jogar com ela.${announcedNote} Dá para mudar até o fim da noite.`,
          }
        : {
            title: activeTargets
              ? activeTargets.length > 0 ? `Alvo: ${activeTargets.join(", ")}` : "Nenhum alvo escolhido"
              : null,
            body: "Escolha seu alvo da noite de acordo com sua role. Você pode trocar a sua escolha até o fim da noite.",
          };
  const Icon = werewolf ? Moon : veteranAlert !== null ? ShieldAlert : amnesiac ? BookOpen : Crosshair;

  return (
    <section aria-label="Sua ação da noite" className="panel-private mt-4 text-left">
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors ${
            veteranAlert ? "bg-[#f0b9bd]/15 text-[#f0b9bd]" : werewolf ? "bg-[#f3e2b3]/15 text-[#f3e2b3]" : "bg-[#c9d4ef]/10 text-[#c9d4ef]"
          }`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          {card.title && <p className="text-base font-semibold text-[#fffaf0]">{card.title}</p>}
          <p className="mt-0.5 text-sm leading-6 text-[#a9b3cc]">{card.body}</p>
        </div>
        {limit !== null && roleId !== "janitor" && (
          <span className="h-fit shrink-0 rounded-full bg-[#c9d4ef]/10 px-2.5 py-0.5 text-xs font-bold text-[#c9d4ef] tabular-nums">
            {limit - usedResource} {limit - usedResource === 1 ? "uso restante" : "usos restantes"}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
          Não foi possível carregar suas ações enviadas. Avise o mestre.
        </p>
      )}


      <ul className="mt-3 flex flex-wrap gap-2 empty:hidden">
        {interactions.map((interaction) => (
          <PlayerNightActionRow
            key={interaction.id}
            gameId={gameId}
            nightId={nightId}
            nightNumber={nightNumber}
            interaction={interaction}
            players={players}
            submission={submissions[interaction.action.id]}
            variants={variants}
            disabled={false}
            exhausted={exhausted}
            shareWithTeam={roleId === "vampire" ? "vampire" : getRoleById(roleId)?.faction === "mafia" ? "mafia" : undefined}
            excludedTargetUids={teamUids}
            amnesiacRolePool={amnesiacRolePool}
            active={interaction.id === activeId}
            onActivate={() => setChosenActiveId(interaction.id)}
            onPickerChange={onPickerChange}
            showSelector={interactions.filter(({ action }) => action.targetCount > 0).length > 1}
          />
        ))}
      </ul>

      {fastTrack && !exhausted && (
        <PlayerNightPass gameId={gameId} nightId={nightId} />
      )}
    </section>
  );
}
