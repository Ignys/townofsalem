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
  maxUses: 2,
  ...exactInvestigationConfig,
});

export const TOWN_INVESTIGATIVE_ROLES = [
  {
    id: "deputy",
    name: "Deputy",
    faction: "town",
    alignment: "Town Investigative",
    description:
      "Enquanto o Sheriff estiver vivo, você não investiga. Quando ele morrer, você assume sua função e passa a descobrir se um alvo aparece como Good ou Evil.",
    beginnerDescription:
      "Observe o Sheriff. Depois que ele morrer, use exatamente as mesmas regras de investigação.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 1,
    importantInteractions: [
      "Só ganha a investigação depois da morte do Sheriff.",
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
      "Durante a noite, escolha uma pessoa para descobrir exatamente qual é a role dela. Você possui duas investigações na partida.",
    beginnerDescription:
      "Diferente do Sheriff, você recebe o nome exato da role. Use suas duas investigações com cuidado.",
    goal: TOWN_GOAL,
    virtueValue: 6,
    cardCount: 1,
    importantInteractions: [
      "Politician e Godfather são revelados por seus nomes reais.",
      "A habilidade pode ser usada no máximo duas vezes.",
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
      "Toda noite, escolha uma pessoa. O moderador informa apenas se ela aparece como Good ou Evil; a role exata não é revelada.",
    beginnerDescription:
      "Seu resultado é uma pista, não uma confirmação absoluta: duas roles enganam sua investigação.",
    goal: TOWN_GOAL,
    virtueValue: 7,
    cardCount: 1,
    importantInteractions: [
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
