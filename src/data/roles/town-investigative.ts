import type { RoleDefinition } from "@/types";

import { exactInvestigationConfig, nightAction } from "./action-builders";
import { investigativeAppearance, TOWN_GOAL } from "./role-helpers";

const sheriffInvestigation = nightAction({
  id: "investigate",
  label: "Investigar alinhamento",
  verb: "investiga",
  priority: 40,
  engineEffectType: "investigate",
  engineEffectConfig: { investigationType: "sheriff" },
});

const exactInvestigation = nightAction({
  id: "investigate-exact-role",
  label: "Descobrir role",
  verb: "descobre a role de",
  ...exactInvestigationConfig,
});

const lookoutWatch = nightAction({
  id: "watch",
  label: "Vigiar",
  verb: "vigia",
  priority: 42,
  engineEffectType: "investigate",
  engineEffectConfig: { investigationType: "lookout" },
});

export const TOWN_INVESTIGATIVE_ROLES = [
  {
    id: "deputy",
    name: "Deputy",
    faction: "town",
    alignment: "Town Investigative",
    description:
      "Enquanto o Sheriff estiver vivo, você não investiga. Na noite seguinte à morte dele, você é promovido a Sheriff e passa a verificar se uma pessoa aparece como Good (boa) ou Evil (má).",
    playTip:
      "O moderador avisará em segredo quando você passar a agir como Sheriff.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 1,
    importantInteractions: [
      "Se houver mais de um Deputy vivo, só um deles, sorteado, vira Sheriff; os outros continuam Deputy.",
      "Como Sheriff, vê Politician como Evil e Godfather como Good.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 40,
    actionDefinitions: [sheriffInvestigation],
    action: sheriffInvestigation,
    investigativeAppearance: investigativeAppearance("Deputy", "town"),
    verificationStatus: "verified",
  },
  {
    id: "investigator",
    name: "Investigator",
    faction: "town",
    alignment: "Town Investigative",
    description:
      "À noite, escolha uma pessoa para descobrir exatamente qual é a role dela.",
    playTip:
      "Guarde as investigações para quem está no centro das discussões: uma role exata pode decidir um julgamento.",
    goal: TOWN_GOAL,
    virtueValue: 6,
    cardCount: 1,
    importantInteractions: [
      "Politician e Godfather são revelados por seus nomes reais.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 41,
    actionDefinitions: [exactInvestigation],
    action: exactInvestigation,
    investigativeAppearance: investigativeAppearance("Investigator", "town"),
    verificationStatus: "verified",
  },
  {
    id: "lookout",
    name: "Lookout",
    faction: "town",
    alignment: "Town Investigative",
    description:
      "À noite, escolha uma pessoa para vigiar. Ao amanhecer, você descobre quem a visitou naquela noite, mas não o que cada um fez.",
    playTip:
      "Vigie quem você acha que será atacado: quem aparecer na porta dele pode ser da Mafia.",
    goal: TOWN_GOAL,
    virtueValue: 5,
    cardCount: 1,
    importantInteractions: [
      "O ataque coletivo da Mafia aparece apenas como \"a Mafia\", sem nomes.",
      "Doctor, Bodyguard, Framer e Transporter também contam como visitas.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 42,
    actionDefinitions: [lookoutWatch],
    action: lookoutWatch,
    investigativeAppearance: investigativeAppearance("Lookout", "town"),
    verificationStatus: "verified",
  },
  {
    id: "sheriff",
    name: "Sheriff",
    faction: "town",
    alignment: "Town Investigative",
    description:
      "Toda noite, escolha uma pessoa. O moderador informa somente se ela aparece como Good (boa) ou Evil (má), sem revelar a role exata.",
    playTip:
      "Um resultado Evil sozinho não é prova: antes de levar alguém a julgamento, considere se pode ser um Politician.",
    goal: TOWN_GOAL,
    virtueValue: 7,
    cardCount: 1,
    importantInteractions: [
      "Aparecem como Good: toda a Town (menos o Politician), Godfather, Executioner, Jester e Witch.",
      "Todas as outras roles aparecem como Evil.",
      "O Werewolf depende da regra ativa na sala.",
      "Se morrer, um Deputy vivo assume sua habilidade.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 40,
    actionDefinitions: [sheriffInvestigation],
    action: sheriffInvestigation,
    investigativeAppearance: investigativeAppearance("Sheriff", "town"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
