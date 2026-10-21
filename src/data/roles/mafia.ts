import type { RoleDefinition } from "@/types";

import {
  exactInvestigationConfig,
  mafiaAttackOrderAction,
  nightAction,
} from "./action-builders";
import { investigativeAppearance, MAFIA_GOAL } from "./role-helpers";

const blackmailAction = nightAction({
  id: "blackmail",
  label: "Silenciar",
  verb: "silencia",
  priority: 45,
  engineEffectType: "status-effect",
  engineEffectConfig: { statusType: "blackmailed" },
});

const consigliereInvestigation = nightAction({
  id: "investigate-exact-role",
  label: "Descobrir role",
  verb: "descobre a role de",
  ...exactInvestigationConfig,
});

const disguiseAction = nightAction({
  id: "disguise",
  label: "Disfarçar-se",
  verb: "se disfarça de",
  priority: 36,
  engineEffectType: "role-trigger",
});

const frameAction = nightAction({
  id: "frame",
  label: "Incriminar",
  verb: "incrimina",
  priority: 35,
  engineEffectType: "role-trigger",
});

const forgeAction = nightAction({
  id: "forge",
  label: "Falsificar",
  verb: "falsifica",
  priority: 37,
  engineEffectType: "role-trigger",
});

const hypnotizeAction = nightAction({
  id: "hypnotize",
  label: "Hipnotizar",
  verb: "hipnotiza",
  priority: 38,
  engineEffectType: "role-trigger",
});

const mafiaRoleBase = {
  faction: "mafia",
  alignment: "Mafia",
  goal: MAFIA_GOAL,
  canDieAtNight: true,
  wakesAtNight: true,
  wakeOrder: 50,
  wakeGroupId: "mafia",
  wakeGroupLabel: "Mafia",
} as const;

export const MAFIA_ROLES = [
  {
    ...mafiaRoleBase,
    id: "blackmailer",
    name: "Blackmailer",
    description:
      "Toda noite, antes da votação de ataque da Mafia, escolha uma pessoa para impedir de falar no dia seguinte. Você não pode escolher a mesma pessoa em duas noites seguidas.",
    playTip:
      "Use o silêncio para dificultar que alguém compartilhe informações ou se defenda.",
    virtueValue: -9,
    cardCount: 1,
    importantInteractions: [
      "Blackmail impede fala, mas não remove o direito de voto.",
      "O ataque coletivo da Mafia não mata na primeira noite.",
    ],
    actionDefinitions: [blackmailAction, mafiaAttackOrderAction],
    investigativeAppearance: investigativeAppearance("Blackmailer", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "consigliere",
    name: "Consigliere",
    description:
      "À noite, antes da votação de ataque da Mafia, escolha uma pessoa para revelar a role exata dela a todos os membros da Mafia.",
    playTip:
      "Investigue quem parece ter informações: a Mafia pode priorizar essa pessoa no ataque.",
    virtueValue: -10,
    cardCount: 1,
    importantInteractions: [
      "Descobre Politician e Godfather por suas roles exatas.",
    ],
    actionDefinitions: [consigliereInvestigation, mafiaAttackOrderAction],
    investigativeAppearance: investigativeAppearance("Consigliere", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "disguiser",
    name: "Disguiser",
    description:
      "À noite, antes da votação de ataque da Mafia, escolha uma pessoa. Até o amanhecer, quem investigar ou vigiar você recebe o resultado dessa pessoa no seu lugar.",
    playTip:
      "Disfarce-se de alguém confirmado como Town nas noites em que você acha que será investigado.",
    virtueValue: -6,
    cardCount: 1,
    importantInteractions: [
      "Sheriff e Investigator recebem o resultado da pessoa escolhida.",
      "O Lookout vê a pessoa escolhida no lugar do Disguiser.",
      "O Consigliere não é enganado.",
    ],
    actionDefinitions: [disguiseAction, mafiaAttackOrderAction],
    investigativeAppearance: investigativeAppearance("Disguiser", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "framer",
    name: "Framer",
    description:
      "À noite, antes da votação de ataque da Mafia, escolha uma pessoa para incriminar. Até o amanhecer, ela aparece como Evil (má) para o Sheriff e como Mafioso para o Investigator.",
    playTip:
      "Incrimine quem está prestes a ser investigado para jogar a Town contra si mesma.",
    virtueValue: -7,
    cardCount: 1,
    importantInteractions: [
      "A incriminação vale só para a noite em que foi feita.",
      "O Lookout ainda vê o Framer visitando o alvo.",
      "O Consigliere não é enganado.",
    ],
    actionDefinitions: [frameAction, mafiaAttackOrderAction],
    investigativeAppearance: investigativeAppearance("Framer", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "forger",
    name: "Forger",
    description:
      "À noite, antes da votação de ataque da Mafia, escolha uma pessoa. Se ela morrer nesta noite, a cidade verá a role dela como Townie.",
    playTip:
      "Falsifique o alvo do ataque da Mafia para esconder que vocês mataram um Sheriff ou um Doctor.",
    virtueValue: -7,
    cardCount: 1,
    importantInteractions: [
      "Os usos são limitados conforme o tamanho da mesa e são gastos mesmo se o alvo sobreviver.",
      "Se o Janitor também limpar a vítima, a role fica escondida.",
      "O Medium ainda pode buscar pistas sobre a vítima.",
    ],
    actionDefinitions: [forgeAction, mafiaAttackOrderAction],
    investigativeAppearance: investigativeAppearance("Forger", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "hypnotist",
    name: "Hypnotist",
    description:
      "À noite, antes da votação de ataque da Mafia, escolha uma pessoa. Ao amanhecer, ela recebe uma mensagem falsa: que foi bloqueada, curada, protegida ou trocada de lugar.",
    playTip:
      "Hipnotize quem fala muito sobre as próprias noites: uma mensagem falsa pode desacreditar uma role importante.",
    virtueValue: -5,
    cardCount: 1,
    importantInteractions: [
      "A mensagem é sorteada e não muda o que aconteceu de verdade na noite.",
      "A mensagem de bloqueio pode fazer um investigador duvidar do próprio resultado.",
    ],
    actionDefinitions: [hypnotizeAction, mafiaAttackOrderAction],
    investigativeAppearance: investigativeAppearance("Hypnotist", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "godfather",
    name: "Godfather",
    description:
      "Vote com a Mafia para escolher o alvo do ataque coletivo. Se a votação empatar, seu voto decide.",
    playTip:
      "Aproveite que o Sheriff não te detecta para se defender com confiança nos julgamentos.",
    virtueValue: -8,
    cardCount: 1,
    importantInteractions: [
      "Aparece como Good para o Sheriff, mas é revelado por Investigator e Consigliere.",
      "O ataque coletivo da Mafia não mata na primeira noite.",
    ],
    actionDefinitions: [mafiaAttackOrderAction],
    action: mafiaAttackOrderAction,
    investigativeAppearance: investigativeAppearance("Godfather", "mafia", "Good"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "janitor",
    name: "Janitor",
    description:
      "Você participa do ataque coletivo da Mafia e esconde a role das vítimas desse ataque.",
    playTip:
      "Com a role da vítima escondida, a Mafia pode blefar sobre quem ela era.",
    virtueValue: -8,
    cardCount: 1,
    importantInteractions: [
      "O Medium ainda pode buscar pistas sobre uma vítima limpa.",
    ],
    actionDefinitions: [mafiaAttackOrderAction],
    action: mafiaAttackOrderAction,
    investigativeAppearance: investigativeAppearance("Janitor", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "mafioso",
    name: "Mafioso",
    description:
      "Ajude a Mafia durante o dia e vote com a facção no alvo do ataque coletivo durante a noite.",
    playTip:
      "Defenda seus parceiros sem deixar a coordenação óbvia.",
    virtueValue: -6,
    cardCount: 5,
    importantInteractions: [
      "O Godfather desempata a votação interna quando estiver vivo.",
      "O ataque coletivo da Mafia não mata na primeira noite.",
    ],
    actionDefinitions: [mafiaAttackOrderAction],
    action: mafiaAttackOrderAction,
    investigativeAppearance: investigativeAppearance("Mafioso", "mafia"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
