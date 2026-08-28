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
      "Enquanto o Sheriff estiver vivo, você não investiga. Na noite seguinte à morte dele, um Deputy vivo é promovido — por sorteio, se houver mais de um — e passa a verificar se uma pessoa aparece como Good (boa) ou Evil (má).",
    playTip:
      "O moderador avisará em segredo quando você passar a agir como Sheriff.",
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
      "À noite, escolha uma pessoa para descobrir exatamente qual é a role dela. A quantidade total de investigações depende do número de jogadores da partida.",
    playTip:
      "Diferente do Sheriff, você recebe o nome exato da role. Use suas investigações com cuidado.",
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
      "Toda noite, escolha uma pessoa. O moderador informa somente se ela aparece como Good (boa) ou Evil (má), sem revelar a role exata. Mafia e Serial Killer aparecem como Evil, exceto o Godfather.",
    playTip:
      "Lembre-se das exceções: o Politician aparece como Evil, e o Godfather aparece como Good.",
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
