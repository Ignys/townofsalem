import type { Faction } from "@/types";

export const TOWN_GOAL =
  "Vença com a Town, ajudando a eliminar os criminosos e demais roles malignas.";

export const MAFIA_GOAL =
  "Vença com a Mafia. Ela vence quando seus membros vivos igualam ou superam a Town viva e nenhuma outra role Evil impede a vitória.";

export function investigativeAppearance(
  roleName: string,
  faction: Faction,
  sheriffOverride?: "Good" | "Evil",
): Record<string, string> {
  return {
    sheriff:
      sheriffOverride ?? (faction === "town" ? "Good" : "Evil"),
    "exact-role": roleName,
  };
}

export const AMBIGUOUS_NIGHT_IMMUNITY_NOTE =
  "A precedência desta interação com imunidade noturna deve ser decidida nas regras da partida antes da resolução automática.";
