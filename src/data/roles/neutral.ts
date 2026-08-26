import type { RoleDefinition } from "@/types";

import { nightAction } from "./action-builders";
import {
  NIGHT_IMMUNITY_RULE,
  investigativeAppearance,
} from "./role-helpers";

const rememberAction = nightAction({
  id: "remember-role",
  label: "Lembrar role",
  verb: "lembra a role de",
  targetCount: 0,
  availableOnNight: 3,
});

const chooseExecutionTarget = nightAction({
  id: "choose-execution-target",
  label: "Escolher alvo",
  verb: "marca como alvo",
  availableOnNight: 1,
  maxUses: 1,
});

const serialKillerAttack = nightAction({
  id: "attack",
  label: "Matar",
  verb: "ataca",
  availableFromNight: 2,
  priority: 50,
  engineEffectType: "attack",
});

const werewolfAttack = nightAction({
  id: "full-moon-attack",
  label: "Atacar adjacentes",
  verb: "ataca os jogadores adjacentes",
  targetCount: 2,
  targetRelation: "adjacent-pair",
  availableFromNight: 2,
  evenNightsOnly: true,
  priority: 50,
  engineEffectType: "attack",
});

const curseAction = nightAction({
  id: "curse",
  label: "Amaldiçoar",
  verb: "amaldiçoa",
  priority: 55,
  engineEffectType: "status-effect",
  engineEffectConfig: { statusType: "cursed" },
});

export const NEUTRAL_ROLES = [
  {
    id: "amnesiac",
    name: "Amnesiac",
    faction: "neutral",
    alignment: "Neutral Benign",
    description:
      "Até a terceira noite, aja como um Townie. Na Night 3, torne-se aleatoriamente uma das roles que o moderador separou antes da partida.",
    beginnerDescription:
      "Se a partida acabar antes da Night 3, você ainda vence. Depois de lembrar, adota a habilidade, facção e objetivo da nova role.",
    goal:
      "Vença se a partida terminar antes da Night 3; depois da transformação, siga a condição de vitória da role lembrada.",
    virtueValue: 0,
    cardCount: 1,
    importantInteractions: [
      "O conjunto de roles possíveis precisa ser registrado antes da partida.",
      "A transformação ocorre na Night 3 e altera alinhamento, habilidades e condição de vitória.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 5,
    actionDefinitions: [rememberAction],
    action: rememberAction,
    investigativeAppearance: investigativeAppearance("Amnesiac", "neutral"),
    verificationStatus: "verified",
  },
  {
    id: "executioner",
    name: "Executioner",
    faction: "neutral",
    alignment: "Neutral Evil",
    description:
      "Na primeira noite, escolha um alvo. Você vence se ele for enforcado; se ele morrer à noite antes disso, você se transforma em Jester.",
    beginnerDescription:
      "Convença a Town a enforcar seu alvo. Uma simples morte noturna não cumpre seu objetivo.",
    goal: "Faça seu alvo ser enforcado em um julgamento.",
    virtueValue: -4,
    cardCount: 1,
    importantInteractions: [
      "Se o alvo morrer durante a noite, transforma-se em Jester.",
      "A consequência de uma morte diurna que não seja enforcamento deve ser configurada pelo grupo.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 6,
    actionDefinitions: [chooseExecutionTarget],
    action: chooseExecutionTarget,
    investigativeAppearance: investigativeAppearance("Executioner", "neutral"),
    verificationStatus: "needs-verification",
    verificationNotes: [
      "A transformação após uma morte diurna não causada por enforcamento não está definida.",
    ],
  },
  {
    id: "jester",
    name: "Jester",
    faction: "neutral",
    alignment: "Neutral Evil",
    description:
      "Seu objetivo é ser enforcado. Imediatamente depois, escolha uma das pessoas que votaram Guilty em você para morrer.",
    beginnerDescription:
      "Pareça suspeito o bastante para ser condenado; sua vingança só pode atingir alguém que votou Guilty.",
    goal: "Seja enforcado em um julgamento.",
    virtueValue: -1,
    cardCount: 2,
    importantInteractions: [
      "A vingança só pode escolher um eleitor que votou Guilty.",
      "Peaceful Townie não é elegível; Spiteful Townie sempre é elegível se votou.",
    ],
    canDieAtNight: true,
    investigativeAppearance: investigativeAppearance("Jester", "neutral"),
    verificationStatus: "verified",
  },
  {
    id: "serial-killer",
    name: "Serial Killer",
    faction: "neutral",
    alignment: "Neutral Killing",
    description:
      "A partir da segunda noite, escolha uma pessoa por noite para matar. Você possui imunidade a mortes noturnas.",
    beginnerDescription:
      "Você joga sozinho, ataca toda noite a partir da Night 2 e não morre durante a noite.",
    goal:
      "Permaneça como a ameaça independente vencedora depois de eliminar os demais lados, conforme a regra configurada pelo grupo.",
    virtueValue: -8,
    cardCount: 1,
    importantInteractions: [
      "Não pode atacar na primeira noite.",
      NIGHT_IMMUNITY_RULE,
    ],
    canDieAtNight: false,
    wakesAtNight: true,
    wakeOrder: 50,
    actionDefinitions: [serialKillerAttack],
    action: serialKillerAttack,
    investigativeAppearance: investigativeAppearance("Serial Killer", "neutral"),
    verificationStatus: "verified",
    verificationNotes: [
      "A condição formal de vitória ainda deve ser configurada.",
    ],
  },
  {
    id: "werewolf",
    name: "Werewolf",
    faction: "neutral",
    alignment: "Neutral Killing",
    description:
      "A partir da Night 2, nas noites pares de lua cheia, escolha dois jogadores adjacentes na mesa para matar.",
    beginnerDescription:
      "A ordem dos assentos importa: em cada noite par, selecione exatamente dois jogadores vizinhos.",
    goal:
      "Permaneça como a ameaça independente vencedora depois de eliminar os demais lados, conforme a regra configurada pelo grupo.",
    virtueValue: -9,
    cardCount: 1,
    importantInteractions: [
      "Ataca somente nas noites pares, começando na Night 2.",
      "Os dois alvos precisam ocupar assentos adjacentes.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 50,
    actionDefinitions: [werewolfAttack],
    action: werewolfAttack,
    investigativeAppearance: investigativeAppearance("Werewolf", "neutral"),
    verificationStatus: "needs-verification",
    verificationNotes: [
      "A condição formal de vitória deve ser configurada pelo grupo.",
    ],
  },
  {
    id: "witch",
    name: "Witch",
    faction: "neutral",
    alignment: "Neutral Evil",
    description:
      "Toda noite, escolha uma pessoa para amaldiçoar. Quando todos os demais jogadores vivos estiverem cursed, eles morrem e você vence.",
    beginnerDescription:
      "Espalhe sua maldição sem ser descoberta. As maldições permanecem acumuladas.",
    goal:
      "Amaldiçoe todos os demais jogadores vivos; quando isso acontecer, eles morrem e você vence.",
    virtueValue: -5,
    cardCount: 1,
    importantInteractions: [
      "A maldição permanece entre noites.",
      "Pode visitar um Veteran em Alert já na primeira noite.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 55,
    actionDefinitions: [curseAction],
    action: curseAction,
    investigativeAppearance: investigativeAppearance("Witch", "neutral"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
