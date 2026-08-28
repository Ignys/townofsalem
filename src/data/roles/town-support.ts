import type { RoleDefinition } from "@/types";

import { nightAction } from "./action-builders";
import { investigativeAppearance, TOWN_GOAL } from "./role-helpers";

const seanceAction = nightAction({
  id: "seance",
  label: "Realizar séance",
  verb: "consulta",
  allowDeadTarget: true,
  requireDeadTarget: true,
  priority: 45,
  engineEffectType: "role-trigger",
});

export const TOWN_SUPPORT_ROLES = [
  {
    id: "mayor",
    name: "Mayor",
    faction: "town",
    alignment: "Town Support",
    description:
      "Durante o dia, você pode revelar sua carta à cidade. Depois disso, o peso do seu voto depende do número de jogadores da partida.",
    playTip:
      "Revele-se quando o voto extra fizer diferença, lembrando que você perderá a possibilidade de cura do Doctor.",
    goal: TOWN_GOAL,
    virtueValue: 8,
    cardCount: 1,
    importantInteractions: [
      "Depois de revelado, o voto vale 2, 3 ou 4 conforme o tamanho da mesa.",
      "Um Mayor revelado não pode ser curado pelo Doctor.",
    ],
    canDieAtNight: true,
    investigativeAppearance: investigativeAppearance("Mayor", "town"),
    verificationStatus: "verified",
  },
  {
    id: "medium",
    name: "Medium",
    faction: "town",
    alignment: "Town Support",
    description:
      "À noite, escolha uma pessoa morta. O moderador mostrará uma quantidade de suspeitos calculada pelo tamanho da partida; um deles foi responsável pela morte. Essa habilidade também ajuda a recuperar informações sobre a role da vítima.",
    playTip:
      "Use os mortos para recuperar informações, especialmente quando um Janitor escondeu a role de uma vítima.",
    goal: TOWN_GOAL,
    virtueValue: 3,
    cardCount: 1,
    importantInteractions: [
      "Pode escolher jogadores mortos.",
      "É especialmente útil para investigar vítimas limpas pelo Janitor.",
    ],
    canDieAtNight: true,
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
      "Você participa normalmente das discussões e acusações, mas em todo julgamento é obrigado a votar Innocent (inocente).",
    playTip:
      "Você nunca pode votar Guilty no veredito, mesmo quando acredita que o acusado é culpado.",
    goal: TOWN_GOAL,
    virtueValue: -1,
    cardCount: 1,
    importantInteractions: [
      "Seu voto de veredito é sempre Innocent.",
      "Nunca entra no grupo de votos Guilty que um Jester enforcado pode punir.",
    ],
    canDieAtNight: true,
    investigativeAppearance: investigativeAppearance("Peaceful Townie", "town"),
    verificationStatus: "verified",
  },
  {
    id: "politician",
    name: "Politician",
    faction: "town",
    alignment: "Town Support",
    description:
      "Você pertence à Town e não possui habilidade ativa, mas aparece como Evil (má) quando é investigado pelo Sheriff.",
    playTip:
      "Prepare-se para explicar por que o Sheriff recebeu um resultado Evil mesmo você sendo da Town.",
    goal: TOWN_GOAL,
    virtueValue: -2,
    cardCount: 2,
    importantInteractions: [
      "A investigação do Sheriff retorna Evil.",
      "Investigator e Consigliere ainda descobrem Politician como role exata.",
    ],
    canDieAtNight: true,
    investigativeAppearance: investigativeAppearance("Politician", "town", "Evil"),
    verificationStatus: "verified",
  },
  {
    id: "spiteful-townie",
    name: "Spiteful Townie",
    faction: "town",
    alignment: "Town Support",
    description:
      "Você participa normalmente das discussões e acusações, mas em todo julgamento é obrigado a votar Guilty (culpado).",
    playTip:
      "Você nunca pode votar Innocent; isso é especialmente arriscado quando o acusado pode ser Jester.",
    goal: TOWN_GOAL,
    virtueValue: -1,
    cardCount: 1,
    importantInteractions: [
      "Seu voto de veredito é sempre Guilty.",
      "Pode ser escolhido pela vingança de um Jester que foi enforcado.",
    ],
    canDieAtNight: true,
    investigativeAppearance: investigativeAppearance("Spiteful Townie", "town"),
    verificationStatus: "verified",
  },
  {
    id: "survivor",
    name: "Survivor",
    faction: "town",
    alignment: "Town Support",
    description:
      "Você pertence à Town e deve ajudar a eliminar as ameaças da cidade. Não pode ser morto durante a noite, mas ainda pode ser enforcado durante o dia.",
    playTip:
      "Ataques noturnos não matam você, mas um julgamento ainda pode.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 2,
    importantInteractions: [
      "Possui imunidade a mortes noturnas.",
      "Tentativas de morte durante a noite não eliminam esta role.",
    ],
    canDieAtNight: false,
    investigativeAppearance: investigativeAppearance("Survivor", "town"),
    verificationStatus: "verified",
  },
  {
    id: "townie",
    name: "Townie",
    faction: "town",
    alignment: "Town Support",
    description:
      "Você não possui habilidade especial. Converse, analise comportamentos, compartilhe informações, acuse e vote para ajudar a Town.",
    playTip:
      "Sua principal ferramenta é a discussão. Escute as alegações e use seu voto com cuidado.",
    goal: TOWN_GOAL,
    virtueValue: 1,
    cardCount: 8,
    importantInteractions: [
      "Seu voto tem peso normal; apenas um Mayor revelado recebe peso ampliado.",
    ],
    canDieAtNight: true,
    investigativeAppearance: investigativeAppearance("Townie", "town"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
