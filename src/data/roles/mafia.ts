import type { RoleDefinition } from "@/types";

import {
  exactInvestigationConfig,
  mafiaVoteAction,
  nightAction,
} from "./action-builders";
import { investigativeAppearance, MAFIA_GOAL } from "./role-helpers";

const blackmailAction = nightAction({
  id: "blackmail",
  label: "Silenciar",
  verb: "silencia",
  priority: 55,
  engineEffectType: "status-effect",
  engineEffectConfig: { statusType: "blackmailed" },
});

const consigliereInvestigation = nightAction({
  id: "investigate-exact-role",
  label: "Descobrir role",
  verb: "descobre a role de",
  maxUses: 2,
  ...exactInvestigationConfig,
});

const cleanAction = nightAction({
  id: "clean",
  label: "Limpar vítima da Mafia",
  verb: "esconde a role de",
  maxUses: 2,
  priority: 60,
  engineEffectType: "clean",
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
      "Toda noite, acorde com a Mafia, participe da escolha do alvo coletivo e escolha uma pessoa para impedir de falar no dia seguinte.",
    beginnerDescription:
      "Silencie alguém por um dia. A pessoa continua viva e ainda pode votar.",
    virtueValue: -9,
    cardCount: 1,
    importantInteractions: [
      "Blackmail impede fala, mas não remove o direito de voto.",
      "O ataque coletivo da Mafia não mata na primeira noite.",
    ],
    actionDefinitions: [mafiaVoteAction, blackmailAction],
    investigativeAppearance: investigativeAppearance("Blackmailer", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "consigliere",
    name: "Consigliere",
    description:
      "Toda noite, participe da escolha da Mafia e, em até duas noites da partida, investigue alguém para descobrir sua role exata.",
    beginnerDescription:
      "Você tem duas investigações exatas para ajudar a Mafia a escolher alvos importantes.",
    virtueValue: -10,
    cardCount: 1,
    importantInteractions: [
      "Descobre Politician e Godfather por suas roles exatas.",
      "A habilidade de investigação pode ser usada duas vezes.",
    ],
    actionDefinitions: [mafiaVoteAction, consigliereInvestigation],
    investigativeAppearance: investigativeAppearance("Consigliere", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "godfather",
    name: "Godfather",
    description:
      "Toda noite, vote com a Mafia em quem deve ser morto. Se a votação interna empatar, seu voto decide o alvo.",
    beginnerDescription:
      "Coordene a Mafia: seu voto desempata a escolha do alvo e você aparece como Good para o Sheriff.",
    virtueValue: -8,
    cardCount: 1,
    importantInteractions: [
      "Desempata a votação interna da Mafia.",
      "Aparece como Good para Sheriff, mas é revelado por Investigator e Consigliere.",
      "O ataque coletivo da Mafia não mata na primeira noite.",
    ],
    actionDefinitions: [mafiaVoteAction],
    action: mafiaVoteAction,
    investigativeAppearance: investigativeAppearance("Godfather", "mafia", "Good"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "janitor",
    name: "Janitor",
    description:
      "Acorde com a Mafia e esconda as roles das duas primeiras pessoas mortas pelo ataque coletivo da facção.",
    beginnerDescription:
      "Nas duas primeiras mortes da Mafia, registre a limpeza para que a role da vítima não seja revelada.",
    virtueValue: -8,
    cardCount: 1,
    importantInteractions: [
      "Apenas as duas primeiras vítimas mortas pela Mafia têm a role escondida.",
      "O Medium ainda pode buscar pistas sobre uma vítima limpa.",
    ],
    actionDefinitions: [mafiaVoteAction, cleanAction],
    investigativeAppearance: investigativeAppearance("Janitor", "mafia"),
    verificationStatus: "verified",
  },
  {
    ...mafiaRoleBase,
    id: "mafioso",
    name: "Mafioso",
    description:
      "Toda noite, acorde com a Mafia e participe da votação para escolher quem a facção tentará matar.",
    beginnerDescription:
      "Você não possui habilidade especial além de participar da decisão do ataque coletivo.",
    virtueValue: -6,
    cardCount: 5,
    importantInteractions: [
      "O Godfather desempata a votação interna da Mafia.",
      "O ataque coletivo da Mafia não mata na primeira noite.",
    ],
    actionDefinitions: [mafiaVoteAction],
    action: mafiaVoteAction,
    investigativeAppearance: investigativeAppearance("Mafioso", "mafia"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
