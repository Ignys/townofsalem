import {
  getAvailableNightTargets,
  getNightConsoleInteractions,
  type NightConsoleInteraction,
} from "@/features/lobby/night-console-interactions";
import type { GameVariants } from "@/game-engine/variants";
import type { Player, RoleDefinition } from "@/types";

/**
 * Ações que o próprio jogador pode enviar nesta noite.
 *
 * Reutiliza `getNightConsoleInteractions` com um roster de um único jogador, o que
 * herda de graça `canUseActionOnNight`, a exclusão do deputy, o gate `wakesAtNight`
 * e a ordenação por wakeOrder/prioridade.
 *
 * `godfatherDoubleKillWhenLastMafia` é forçada para `false` porque o cliente do jogador
 * não enxerga as roles dos outros e portanto não consegue contar a máfia viva. O caso do
 * Godfather sozinho (targetCount 2) é tratado no espelhamento do host, que roda com o
 * roster completo — a submissão de 1 alvo vira rascunho para o mestre completar.
 */
export function getPlayerNightInteractions(
  viewer: Player,
  roleId: string,
  roleDefinitions: readonly RoleDefinition[],
  nightNumber: number,
  variants?: Partial<GameVariants>,
): readonly NightConsoleInteraction[] {
  if (!viewer.alive) return [];

  return getNightConsoleInteractions(
    [viewer],
    { [viewer.uid]: roleId },
    roleDefinitions,
    nightNumber,
    { ...variants, godfatherDoubleKillWhenLastMafia: false },
  );
}

/**
 * Alvos legais para uma ação do jogador. Usa apenas dados públicos (uid, alive, seat).
 *
 * `excludedUids` tira da lista quem não faz sentido mirar — ex.: os parceiros da Máfia.
 * O próprio jogador e ações sobre mortos não são afetados.
 */
export function getPlayerNightTargets(
  interaction: NightConsoleInteraction,
  players: readonly Player[],
  variants?: Partial<GameVariants>,
  excludedUids: readonly string[] = [],
): readonly Player[] {
  const targets = getAvailableNightTargets(interaction, players, variants);
  if (excludedUids.length === 0 || interaction.action.requireDeadTarget) return targets;
  return targets.filter(
    ({ uid }) => uid === interaction.actor.uid || !excludedUids.includes(uid),
  );
}

export type { NightConsoleInteraction };
