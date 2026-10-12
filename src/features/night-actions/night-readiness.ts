import { ROLE_DEFINITIONS } from "@/data/roles";
import { getRoleResourceLimit } from "@/game-engine/role-resource-limits";
import type { GameVariants } from "@/game-engine/variants";
import type { Player } from "@/types";

import { getPlayerNightInteractions } from "./player-night-interactions";

export const RESOURCE_BY_ROLE: Readonly<Record<string, string>> = {
  mayor: "mayor-vote",
  investigator: "investigator",
  consigliere: "consigliere",
  janitor: "janitor",
  veteran: "veteran-alert",
  vigilante: "vigilante-shot",
};

/** A role já gastou todos os usos (o Janitor limpa sozinho, então nunca "esgota" a ação). */
export function isRoleActionExhausted(
  roleId: string,
  playerCount: number,
  resourceUses: Readonly<Record<string, number>> | undefined,
): boolean {
  const limit = getRoleResourceLimit(roleId, playerCount);
  const used = resourceUses?.[RESOURCE_BY_ROLE[roleId] ?? roleId] ?? 0;
  return roleId !== "janitor" && limit !== null && used >= limit;
}

/** O jogador tem algo para fazer nesta noite (o mesmo critério do painel do celular). */
export function canActTonight(
  player: Player,
  roleId: string,
  nightNumber: number,
  variants: GameVariants,
  playerCount: number,
  resourceUses: Readonly<Record<string, number>> | undefined,
): boolean {
  if (!player.alive) return false;
  if (getPlayerNightInteractions(player, roleId, ROLE_DEFINITIONS, nightNumber, variants).length === 0) return false;
  return !isRoleActionExhausted(roleId, playerCount, resourceUses);
}

/**
 * Ritmo rápido: a noite acaba quando todo mundo que tem ação já confirmou alguma ou passou.
 * Sem ninguém para agir, também conta como completa.
 */
export function isNightComplete(
  actorUids: readonly string[],
  submittedUids: ReadonlySet<string>,
  passedUids: ReadonlySet<string>,
): boolean {
  return actorUids.every((uid) => submittedUids.has(uid) || passedUids.has(uid));
}
