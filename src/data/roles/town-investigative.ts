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

export const TOWN_INVESTIGATIVE_ROLES = [
  {
    id: "deputy",
    name: "Deputy",
    faction: "town",
    alignment: "Town Investigative",
    description:
      "Enquanto o Sheriff estiver vivo, você não investiga. Na noite seguinte à morte dele, você pode ser promovido e passa a verificar se uma pessoa aparece como Good (boa) ou Evil (má).",
    playTip:
      "O moderador avisará em segredo quando você passar a agir como Sheriff.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 1,
    importantInteractions: [
      "Se houver mais de um Deputy vivo, a promoção é por sorteio.",
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
      "Mafia e Serial Killer aparecem como Evil.",
      "Politician é Town, mas aparece como Evil.",
      "Godfather é Mafia, mas aparece como Good.",
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
