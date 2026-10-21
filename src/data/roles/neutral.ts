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
  maxUses: 1,
  priority: 6,
  engineEffectType: "status-effect",
  engineEffectConfig: { statusType: "execution-target" },
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

const vampireBiteVote = nightAction({
  id: "vampire-bite-vote",
  label: "Votar mordida",
  verb: "vota para morder",
  sharedFactionAction: true,
  availableFromNight: 2,
  priority: 50,
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
      "Escolha um alvo à noite (a partir da primeira, até escolher). Você vence se essa pessoa for enforcada. Se ela morrer durante a noite antes disso, você se transforma em Jester.",
    playTip:
      "Convença a Town de que seu alvo é suspeito sem parecer obcecado por ele.",
    goal: "Faça seu alvo ser enforcado em um julgamento.",
    virtueValue: -4,
    cardCount: 1,
    importantInteractions: [
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
      "Seu objetivo é ser enforcado. Quando isso acontecer, escolha imediatamente uma das pessoas que votaram Guilty (culpado) em você para morrer; essa morte não pode ser impedida.",
    playTip:
      "Pareça suspeito o bastante para ser condenado, sem deixar claro que é isso que você quer.",
    goal: "Seja enforcado em um julgamento.",
    virtueValue: -1,
    cardCount: 2,
    importantInteractions: [
      "Peaceful Townie nunca é elegível; Spiteful Townie sempre é elegível se votou.",
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
      "Uma role que não pode morrer à noite ignora seus ataques.",
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
      "Planeje os assentos com antecedência: cada morte muda quem fica adjacente.",
    goal:
      "Permaneça como a ameaça independente vencedora depois de eliminar os demais lados, conforme a regra configurada pelo grupo.",
    virtueValue: -9,
    cardCount: 1,
    importantInteractions: [
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
      "Espalhe a maldição sem chamar atenção: se descobrirem, você vira alvo do julgamento.",
    goal:
      "Amaldiçoe todos os demais jogadores vivos; quando isso acontecer, eles morrem e você vence.",
    virtueValue: -5,
    cardCount: 1,
    importantInteractions: [
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
  {
    id: "vampire",
    name: "Vampire",
    faction: "neutral",
    alignment: "Neutral Chaos",
    description:
      "A partir da segunda noite, os Vampiros votam em quem morder; o Vampiro convertido mais recentemente faz a mordida. Membros da Town (exceto o Vampire Hunter) e neutros que não matam viram Vampiros; qualquer outro alvo é atacado.",
    playTip:
      "Converta roles fortes da Town cedo: cada conversão tira um voto da cidade e soma um ao seu lado.",
    goal:
      "Elimine toda a Town e toda a Mafia. Vampiros não vencem junto com nenhuma das duas.",
    virtueValue: -9,
    cardCount: 1,
    importantInteractions: [
      "No máximo 4 Vampiros vivos ao mesmo tempo; com o limite cheio, a mordida vira ataque.",
      "Depois de uma conversão, os Vampiros passam uma noite sem morder.",
      "Uma cura do Doctor, a proteção do Bodyguard ou um Veteran em Alert impedem a conversão.",
      "Morder o Vampire Hunter mata o Vampiro que mordeu.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 52,
    actionDefinitions: [vampireBiteVote],
    action: vampireBiteVote,
    investigativeAppearance: investigativeAppearance("Vampire", "neutral"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
