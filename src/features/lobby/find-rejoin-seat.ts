import { normalizePlayerName } from "@/lib/utils/player-name";

/**
 * O lugar de quem caiu e voltou com outra sessão: o único jogador com o mesmo nickname
 * (sem diferenciar maiúsculas). Dois jogadores com o mesmo nome não dão para distinguir.
 */
export function findRejoinSeat(
  players: Readonly<Record<string, { name?: string }>> | null | undefined,
  nickname: string,
): string | null {
  const wanted = normalizePlayerName(nickname).toLocaleLowerCase("pt-BR");
  if (!wanted) return null;
  const matches = Object.entries(players ?? {})
    .filter(([, player]) => normalizePlayerName(player.name ?? "").toLocaleLowerCase("pt-BR") === wanted)
    .map(([uid]) => uid);
  return matches.length === 1 ? matches[0] : null;
}
