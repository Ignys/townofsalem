"use client";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { getRoleResourceLimit } from "@/game-engine/role-resource-limits";
import type { GameVariants } from "@/game-engine/variants";
import type { Player } from "@/types";

import { getPlayerNightInteractions } from "./player-night-interactions";
import { PlayerNightActionRow } from "./player-night-action-row";
import { usePlayerNightSubmissions } from "./use-player-night-submissions";

const RESOURCE_BY_ROLE: Readonly<Record<string, string>> = {
  mayor: "mayor-vote",
  investigator: "investigator",
  consigliere: "consigliere",
  janitor: "janitor",
  veteran: "veteran-alert",
  vigilante: "vigilante-shot",
};

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
}: PlayerNightActionPanelProps) {
  const { submissions, loaded, error } = usePlayerNightSubmissions(gameId, nightId);
  const interactions = nightId && nightNumber
    ? getPlayerNightInteractions(viewer, roleId, ROLE_DEFINITIONS, nightNumber, variants)
    : [];

  if (!nightId || !nightNumber || !viewer.alive || interactions.length === 0) {
    return (
      <p className="text-sm leading-6 text-[#a9b3cc]">
        A noite está em andamento. Aguarde o mestre chamar sua role.
      </p>
    );
  }

  if (!loaded) {
    return <p className="text-sm text-[#a9b3cc]">Carregando suas ações…</p>;
  }

  const limit = getRoleResourceLimit(roleId, playerCount);
  const usedResource = resourceUses?.[RESOURCE_BY_ROLE[roleId] ?? roleId] ?? 0;
  const exhausted = roleId !== "janitor" && limit !== null && usedResource >= limit;

  return (
    <section aria-label="Sua ação da noite" className="text-left">
      <p className="text-sm leading-6 text-[#a9b3cc]">
        Escolha sua ação desta noite. O mestre recebe sua escolha no console e pode ajustá-la.
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-[#f0b9bd]">
          Não foi possível carregar suas ações enviadas. Avise o mestre.
        </p>
      )}

      {limit !== null && roleId !== "janitor" && (
        <p className="mt-1 text-xs text-[#9f9990]">
          Usos: {usedResource} de {limit}.
        </p>
      )}

      <ul className="mt-3 grid gap-3">
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
          />
        ))}
      </ul>
    </section>
  );
}
