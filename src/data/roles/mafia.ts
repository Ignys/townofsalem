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
  label: "Escolher disfarce",
  verb: "se disfarça de",
  maxUses: 1,
  priority: 60,
  engineEffectType: "status-effect",
  engineEffectConfig: { statusType: "disguised-as", countsAsVisit: false },
});

const ambushAction = nightAction({
  id: "ambush",
  label: "Emboscar casa",
  verb: "embosca a casa de",
  priority: 50,
  engineEffectType: "status-effect",
  engineEffectConfig: { statusType: "ambushed", attacksVisitors: "first" },
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
    id: "ambusher",
    name: "Ambusher",
    description:
      "Toda noite você pode esperar do lado de fora da casa de uma pessoa e atacar quem a visitar. Na noite em que você emboscar, a Mafia não realiza o ataque coletivo.",
    playTip:
      "Embosque quem a cidade suspeita: o Doctor e o Sheriff costumam visitar exatamente essa casa.",
    virtueValue: -8,
    cardCount: 1,
    importantInteractions: [
      "Ataca apenas um visitante; o mestre sorteia quando há mais de um.",
      "Não ataca você mesmo nem o dono da casa emboscada.",
      "Emboscar um Veteran em alerta mata o Ambusher.",
    ],
    actionDefinitions: [ambushAction, mafiaAttackOrderAction],
    investigativeAppearance: investigativeAppearance("Ambusher", "mafia"),
    verificationStatus: "needs-verification",
  },
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
      "À noite, antes da votação de ataque da Mafia, escolha uma pessoa para revelar a role exata dela a todos os membros da Mafia. A quantidade total de investigações depende do número de jogadores da partida.",
    playTip:
      "Use suas investigações exatas limitadas para ajudar a Mafia a escolher alvos importantes.",
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
      "Uma vez por partida, escolha uma pessoa. Quando você morrer, o mestre revela você com a carta dessa pessoa em vez da sua verdadeira.",
    playTip:
      "Escolha alguém cuja carta você conseguiria defender na discussão do dia seguinte.",
    virtueValue: -7,
    cardCount: 1,
    importantInteractions: [
      "Se o Janitor limpar o mesmo corpo, a limpeza prevalece e nada é revelado.",
      "A contagem de cartas da partida pode denunciar o disfarce.",
    ],
    actionDefinitions: [disguiseAction, mafiaAttackOrderAction],
    investigativeAppearance: investigativeAppearance("Disguiser", "mafia"),
    verificationStatus: "needs-verification",
  },
  {
    ...mafiaRoleBase,
    id: "godfather",
    name: "Godfather",
    description:
      "Vote com a Mafia para escolher o alvo do ataque coletivo, que só pode matar a partir da segunda noite. Se a votação empatar, seu voto decide. Para o Sheriff, você aparece como Good (bom).",
    playTip:
      "Coordene a Mafia, mande atacar um alvo e lembre que você aparece como Good para o Sheriff.",
    virtueValue: -8,
    cardCount: 1,
    importantInteractions: [
      "Seu voto desempata a votação interna da Mafia.",
      "Aparece como Good para Sheriff, mas é revelado por Investigator e Consigliere.",
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
      "Você participa do ataque coletivo da Mafia e esconde a role das primeiras vítimas mortas por esse ataque. A quantidade total de limpezas depende do número de jogadores da partida.",
    playTip:
      "A role de uma vítima limpa não é revelada aos jogadores, o que permite à Mafia blefar usando essa informação.",
    virtueValue: -8,
    cardCount: 1,
    importantInteractions: [
      "O limite de vítimas limpas varia com o tamanho da partida.",
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
      "Você não possui habilidade particular, mas participa da votação do ataque coletivo.",
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
