import {
  getMediumClueCandidateCount,
  getRoleResourceLimit,
} from "@/game-engine/role-resource-limits";

export interface RoleInteractionLimit {
  amount: number;
  description: string;
}

function pluralize(
  amount: number,
  singular: string,
  plural: string,
): string {
  return amount === 1 ? singular : plural;
}

export function getRoleInteractionLimit(
  roleId: string,
  playerCount: number,
): RoleInteractionLimit | null {
  if (roleId === "medium") {
    const amount = getMediumClueCandidateCount(playerCount);
    return amount === null
      ? null
      : {
          amount,
          description: `Em cada sessão mediúnica, o mestre mostra exatamente ${amount} suspeitos. Um deles é responsável pela morte.`,
        };
  }

  const amount = getRoleResourceLimit(roleId, playerCount);
  if (amount === null) return null;

  if (roleId === "mayor") {
    return {
      amount,
      description: `Depois de revelar sua role, cada um dos seus votos vale ${amount} ${pluralize(amount, "voto", "votos")}.`,
    };
  }

  if (roleId === "investigator") {
    return {
      amount,
      description: `Você pode investigar até ${amount} ${pluralize(amount, "vez", "vezes")} durante toda a partida.`,
    };
  }

  if (roleId === "consigliere") {
    return {
      amount,
      description: `Você pode revelar a role exata de alguém até ${amount} ${pluralize(amount, "vez", "vezes")} durante toda a partida.`,
    };
  }

  if (roleId === "janitor") {
    return {
      amount,
      description: amount === 1
        ? "Você pode esconder a role de até 1 vítima morta pela Mafia."
        : `Você pode esconder a role de até ${amount} vítimas mortas pela Mafia.`,
    };
  }

  if (roleId === "veteran") {
    return {
      amount,
      description: `Você pode entrar em alerta até ${amount} ${pluralize(amount, "vez", "vezes")} durante toda a partida.`,
    };
  }

  if (roleId === "vigilante") {
    return {
      amount,
      description: `Você pode atirar até ${amount} ${pluralize(amount, "vez", "vezes")} durante toda a partida.`,
    };
  }

  return null;
}
