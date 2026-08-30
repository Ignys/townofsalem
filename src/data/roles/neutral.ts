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
  priority: 5,
  engineEffectType: "role-trigger",
  engineEffectConfig: { countsAsVisit: false },
});

const chooseExecutionTarget = nightAction({
  id: "choose-execution-target",
  label: "Escolher alvo",
  verb: "marca como alvo",
  availableOnNight: 1,
  maxUses: 1,
  priority: 6,
  engineEffectType: "status-effect",
  engineEffectConfig: { statusType: "execution-target" },
});

const chooseGuardianTarget = nightAction({
  id: "choose-guardian-target",
  label: "Escolher protegido",
  verb: "passa a proteger",
  availableOnNight: 1,
  maxUses: 1,
  priority: 6,
  engineEffectType: "status-effect",
  engineEffectConfig: { statusType: "guardian-target", countsAsVisit: false },
});

const guardianProtection = nightAction({
  id: "guard-target",
  label: "Proteger o alvo",
  verb: "protege",
  availableFromNight: 2,
  maxUses: 3,
  priority: 30,
  engineEffectType: "protect",
  engineEffectConfig: { protectionType: "doctor" },
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
      "Até a terceira noite, você ainda não tem uma facção definitiva. Na noite 3, recebe aleatoriamente uma das roles separadas pelo moderador antes da partida.",
    playTip:
      "Se a partida terminar antes da noite 3, você vence com a facção vencedora. Depois de lembrar, siga a habilidade, a facção e o objetivo da nova role.",
    goal:
      "Vença se a partida terminar antes da noite 3; depois da transformação, siga a condição de vitória da role lembrada.",
    virtueValue: 0,
    cardCount: 1,
    importantInteractions: [
      "O conjunto de roles possíveis precisa ser registrado antes da partida.",
      "A transformação ocorre na noite 3 e altera alinhamento, habilidades e condição de vitória.",
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
      "Na primeira noite, escolha um alvo. Você vence se essa pessoa for enforcada. Se ela morrer durante a noite antes disso, você se transforma em Jester.",
    playTip:
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
    id: "guardian-angel",
    name: "Guardian Angel",
    faction: "neutral",
    alignment: "Neutral Benign",
    description:
      "Na primeira noite, escolha uma pessoa para proteger pelo resto da partida. A partir da segunda noite você pode impedir um ataque contra ela, até 3 vezes na partida.",
    playTip:
      "Você escolhe às cegas, como o Executioner. Proteja seu alvo nas noites em que a cidade mais suspeitar dele.",
    goal: "Termine a partida com o seu alvo vivo, seja qual for a facção vencedora.",
    virtueValue: 2,
    cardCount: 1,
    importantInteractions: [
      "Vence junto de qualquer facção, desde que o alvo esteja vivo no fim.",
      "Aparece como Good para o Sheriff.",
      "Só pode proteger o alvo escolhido na primeira noite.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 6,
    actionDefinitions: [chooseGuardianTarget, guardianProtection],
    investigativeAppearance: investigativeAppearance(
      "Guardian Angel",
      "neutral",
      "Good",
    ),
    verificationStatus: "needs-verification",
    verificationNotes: [
      "O engine não impede que a proteção seja usada em outra pessoa; o mestre confere.",
    ],
  },
  {
    id: "jester",
    name: "Jester",
    faction: "neutral",
    alignment: "Neutral Evil",
    description:
      "Seu objetivo é ser enforcado. Quando isso acontecer, escolha imediatamente uma das pessoas que votaram Guilty (culpado) em você para morrer; essa morte não pode ser impedida.",
    playTip:
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
      "A partir da segunda noite, escolha uma pessoa por noite para matar. Você não pode ser morto durante a noite.",
    playTip:
      "Você joga sozinho e precisa eliminar a Town, a Mafia, o Werewolf e a Witch.",
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
      "Nas noites de lua cheia, que começam na noite 2 e acontecem em todas as noites pares, escolha dois jogadores adjacentes para matar. Eles são adjacentes quando não há outra pessoa viva entre eles.",
    playTip:
      "A ordem dos assentos importa: em cada noite par, selecione exatamente dois jogadores vizinhos.",
    goal:
      "Permaneça como a ameaça independente vencedora depois de eliminar os demais lados, conforme a regra configurada pelo grupo.",
    virtueValue: -9,
    cardCount: 1,
    importantInteractions: [
      "Ataca somente nas noites pares, começando na noite 2.",
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
      "Toda noite, escolha uma pessoa para amaldiçoar. As maldições permanecem. Quando todas as outras pessoas vivas estiverem amaldiçoadas, elas morrem e você vence.",
    playTip:
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
