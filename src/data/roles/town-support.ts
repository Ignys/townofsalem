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

const reviveAction = nightAction({
  id: "revive",
  label: "Ressuscitar",
  verb: "ressuscita",
  allowDeadTarget: true,
  requireDeadTarget: true,
  availableFromNight: 2,
  priority: 70,
  engineEffectType: "role-trigger",
  engineEffectConfig: { countsAsVisit: false },
});

const transportAction = nightAction({
  id: "transport",
  label: "Trocar de lugar",
  verb: "troca de lugar",
  targetCount: 2,
  allowSelfTarget: true,
  priority: 1,
  engineEffectType: "redirect",
});

export const TOWN_SUPPORT_ROLES = [
  {
    id: "mayor",
    name: "Mayor",
    faction: "town",
    alignment: "Town Support",
    description:
      "Durante o dia, você pode revelar sua carta à cidade. Depois disso, seu voto passa a valer mais.",
    playTip:
      "Revele-se quando o voto extra decidir um julgamento importante.",
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
      "À noite, escolha uma pessoa morta. O moderador mostra alguns suspeitos; um deles foi responsável pela morte.",
    playTip:
      "Cruze os suspeitos com os votos e as alegações do dia para descobrir quem matou.",
    goal: TOWN_GOAL,
    virtueValue: 3,
    cardCount: 1,
    importantInteractions: [
      "A quantidade de suspeitos depende do tamanho da partida.",
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
      "Como seu voto não condena ninguém, use a discussão para convencer quem pode votar Guilty.",
    goal: TOWN_GOAL,
    virtueValue: -1,
    cardCount: 1,
    importantInteractions: [
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
      "Você pertence à Town e não possui habilidade ativa, mas aparece como Evil (má) para o Sheriff.",
    playTip:
      "Prepare-se para explicar por que o Sheriff recebeu um resultado Evil mesmo você sendo da Town.",
    goal: TOWN_GOAL,
    virtueValue: -2,
    cardCount: 2,
    importantInteractions: [
      "Investigator e Consigliere descobrem sua role exata.",
    ],
    canDieAtNight: true,
    investigativeAppearance: investigativeAppearance("Politician", "town", "Evil"),
    verificationStatus: "verified",
  },
  {
    id: "retributionist",
    name: "Retributionist",
    faction: "town",
    alignment: "Town Support",
    description:
      "Uma vez por partida, a partir da segunda noite, escolha uma pessoa morta da Town. Ela volta à vida ao amanhecer, com a mesma role.",
    playTip:
      "Guarde a ressurreição para uma role forte que a Town já confirmou, como um Sheriff ou um Doctor.",
    goal: TOWN_GOAL,
    virtueValue: 5,
    cardCount: 1,
    importantInteractions: [
      "Só ressuscita jogadores da Town; escolher alguém de outra facção gasta o uso sem efeito.",
      "A ressurreição acontece mesmo se você morrer na mesma noite.",
      "Ressuscitar não conta como visita.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 46,
    actionDefinitions: [reviveAction],
    action: reviveAction,
    investigativeAppearance: investigativeAppearance("Retributionist", "town"),
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
      "Se o acusado pode ser Jester, tente evitar na discussão que ele chegue ao veredito.",
    goal: TOWN_GOAL,
    virtueValue: -1,
    cardCount: 1,
    importantInteractions: [
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
      "Como os ataques noturnos não te matam, você pode se expor mais na discussão do que os outros.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 2,
    importantInteractions: [
    ],
    canDieAtNight: false,
    investigativeAppearance: investigativeAppearance("Survivor", "town"),
    verificationStatus: "verified",
  },
  {
    id: "transporter",
    name: "Transporter",
    faction: "town",
    alignment: "Town Support",
    description:
      "À noite, escolha duas pessoas para trocar de lugar. Toda ação que miraria uma delas acerta a outra no lugar.",
    playTip:
      "Troque um alvo provável da Mafia com alguém que não pode morrer à noite, como um Survivor.",
    goal: TOWN_GOAL,
    virtueValue: 3,
    cardCount: 1,
    importantInteractions: [
      "Você age antes de todos: ataques, curas e investigações seguem a troca.",
      "Pode se incluir em uma das trocas.",
      "Os dois trocados ficam sabendo da troca ao amanhecer.",
      "Os usos são limitados conforme o tamanho da mesa.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 1,
    actionDefinitions: [transportAction],
    action: transportAction,
    investigativeAppearance: investigativeAppearance("Transporter", "town"),
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
      "Escute as alegações com atenção e use seu voto com cuidado.",
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
