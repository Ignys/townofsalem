import type { RoleDefinition } from "@/types";

import { nightAction } from "./action-builders";
import { investigativeAppearance, TOWN_GOAL } from "./role-helpers";

const seanceAction = nightAction({
  id: "seance",
  label: "Realizar séance",
  verb: "consulta",
  allowDeadTarget: true,
  requireDeadTarget: true,
});

export const TOWN_SUPPORT_ROLES = [
  {
    id: "mayor",
    name: "Mayor",
    faction: "town",
    alignment: "Town Support",
    description:
      "Durante o dia, você pode revelar publicamente sua role. Depois disso, seu voto vale dois votos pelo restante da partida.",
    beginnerDescription:
      "Revele-se quando o voto extra fizer diferença, lembrando que você perderá a possibilidade de cura do Doctor.",
    goal: TOWN_GOAL,
    virtueValue: 8,
    cardCount: 1,
    importantInteractions: [
      "Depois de revelado, cada voto do Mayor vale dois.",
      "Um Mayor revelado não pode ser curado pelo Doctor.",
    ],
    attack: "none",
    defense: "none",
    investigativeAppearance: investigativeAppearance("Mayor", "town"),
    verificationStatus: "verified",
  },
  {
    id: "medium",
    name: "Medium",
    faction: "town",
    alignment: "Town Support",
    description:
      "Durante a noite, escolha um jogador morto para realizar uma séance e obter pistas sobre quem o matou.",
    beginnerDescription:
      "Use os mortos para recuperar informações, especialmente quando um Janitor escondeu a role de uma vítima.",
    goal: TOWN_GOAL,
    virtueValue: 3,
    cardCount: 1,
    importantInteractions: [
      "Pode escolher jogadores mortos.",
      "É especialmente útil para investigar vítimas limpas pelo Janitor.",
    ],
    attack: "none",
    defense: "none",
    wakesAtNight: true,
    wakeOrder: 45,
    actionDefinitions: [seanceAction],
    action: seanceAction,
    investigativeAppearance: investigativeAppearance("Medium", "town"),
    verificationStatus: "verified",
  },
  {
    id: "peaceful-townie",
    name: "Peaceful Townie",
    faction: "town",
    alignment: "Town Support",
    description:
      "Você participa normalmente das discussões e acusações, mas em todo julgamento é obrigado a votar Innocent.",
    beginnerDescription:
      "Você nunca pode votar Guilty no veredito, mesmo quando acredita que o acusado é culpado.",
    goal: TOWN_GOAL,
    virtueValue: -1,
    cardCount: 1,
    importantInteractions: [
      "Seu voto de veredito é sempre Innocent.",
      "Nunca entra no grupo de votos Guilty que um Jester enforcado pode punir.",
    ],
    attack: "none",
    defense: "none",
    investigativeAppearance: investigativeAppearance("Peaceful Townie", "town"),
    verificationStatus: "verified",
  },
  {
    id: "politician",
    name: "Politician",
    faction: "town",
    alignment: "Town Support",
    description:
      "Você pertence à Town e não possui habilidade ativa, mas aparece como Evil quando investigado pelo Sheriff.",
    beginnerDescription:
      "Prepare-se para explicar por que o Sheriff recebeu um resultado Evil mesmo você sendo da Town.",
    goal: TOWN_GOAL,
    virtueValue: -2,
    cardCount: 2,
    importantInteractions: [
      "A investigação do Sheriff retorna Evil.",
      "Investigator e Consigliere ainda descobrem Politician como role exata.",
    ],
    attack: "none",
    defense: "none",
    investigativeAppearance: investigativeAppearance("Politician", "town", "Evil"),
    verificationStatus: "verified",
  },
  {
    id: "spiteful-townie",
    name: "Spiteful Townie",
    faction: "town",
    alignment: "Town Support",
    description:
      "Você participa normalmente das discussões e acusações, mas em todo julgamento é obrigado a votar Guilty.",
    beginnerDescription:
      "Você nunca pode votar Innocent; isso é especialmente arriscado quando o acusado pode ser Jester.",
    goal: TOWN_GOAL,
    virtueValue: -1,
    cardCount: 1,
    importantInteractions: [
      "Seu voto de veredito é sempre Guilty.",
      "Pode ser escolhido pela vingança de um Jester que foi enforcado.",
    ],
    attack: "none",
    defense: "none",
    investigativeAppearance: investigativeAppearance("Spiteful Townie", "town"),
    verificationStatus: "verified",
  },
  {
    id: "survivor",
    name: "Survivor",
    faction: "town",
    alignment: "Town Support",
    description:
      "Nesta edição do card game, você pertence à Town e não pode ser morto durante a noite. Ainda pode morrer por efeitos fora da noite.",
    beginnerDescription:
      "Ataques noturnos não matam você, mas um julgamento ainda pode.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 2,
    importantInteractions: [
      "Possui imunidade a mortes noturnas.",
      "A precedência contra Bodyguard e Veteran deve seguir a configuração da partida.",
    ],
    attack: "none",
    defense: "invincible",
    investigativeAppearance: investigativeAppearance("Survivor", "town"),
    verificationStatus: "needs-verification",
    verificationNotes: [
      "As exceções à imunidade noturna exigem uma decisão explícita do grupo.",
    ],
  },
  {
    id: "townie",
    name: "Townie",
    faction: "town",
    alignment: "Town Support",
    description:
      "Você não possui habilidade especial. Converse, analise comportamentos, compartilhe informações, acuse e vote para ajudar a Town.",
    beginnerDescription:
      "Sua principal ferramenta é a discussão. Escute as alegações e use seu voto com cuidado.",
    goal: TOWN_GOAL,
    virtueValue: 1,
    cardCount: 8,
    importantInteractions: [
      "Seu voto tem peso normal; apenas um Mayor revelado vale dois.",
    ],
    attack: "none",
    defense: "none",
    investigativeAppearance: investigativeAppearance("Townie", "town"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
