import type { RoleDefinition } from "@/types";

import { nightAction } from "./action-builders";
import { investigativeAppearance, TOWN_GOAL } from "./role-helpers";

const alertAction = nightAction({
  id: "alert",
  label: "Entrar em Alert",
  verb: "entra em Alert",
  targetCount: 0,
  // Ninguém mata na primeira noite: um Alert ali só gastaria um uso.
  availableFromNight: 2,
  priority: 20,
  engineEffectType: "protect",
  engineEffectConfig: { countsAsVisit: false },
});

const vigilanteShot = nightAction({
  id: "shoot",
  label: "Atirar",
  verb: "atira em",
  availableFromNight: 2,
  priority: 50,
  engineEffectType: "attack",
});

const huntAction = nightAction({
  id: "hunt",
  label: "Caçar",
  verb: "caça",
  priority: 45,
  engineEffectType: "role-trigger",
});

export const TOWN_KILLING_ROLES = [
  {
    id: "veteran",
    name: "Veteran",
    faction: "town",
    alignment: "Town Killing",
    description:
      "À noite, você pode entrar em Alert (alerta). Enquanto estiver alerta, não pode ser morto e ataca todas as pessoas que o visitarem.",
    playTip:
      "Entre em alerta nas noites em que espera ser atacado: o atacante morre na sua porta.",
    goal: TOWN_GOAL,
    virtueValue: 3,
    cardCount: 1,
    importantInteractions: [
      "Aliados que visitarem você durante o Alert também morrem.",
      "Pode usar Alert na primeira noite e atingir uma Witch visitante.",
      "No ataque coletivo da Mafia, somente um representante aleatório recebe o ataque.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 20,
    actionDefinitions: [alertAction],
    action: alertAction,
    investigativeAppearance: investigativeAppearance("Veteran", "town"),
    verificationStatus: "verified",
  },
  {
    id: "vigilante",
    name: "Vigilante",
    faction: "town",
    alignment: "Town Killing",
    description:
      "A partir da segunda noite, escolha uma pessoa para atirar e matar.",
    playTip:
      "Atire só quando tiver bons motivos: um tiro errado mata alguém da Town.",
    goal: TOWN_GOAL,
    virtueValue: 5,
    cardCount: 1,
    importantInteractions: [
      "Não se suicida automaticamente se atingir uma role da Town.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 50,
    actionDefinitions: [vigilanteShot],
    action: vigilanteShot,
    investigativeAppearance: investigativeAppearance("Vigilante", "town"),
    verificationStatus: "verified",
  },
  {
    id: "vampire-hunter",
    name: "Vampire Hunter",
    faction: "town",
    alignment: "Town Killing",
    description:
      "À noite, escolha alguém para investigar. Se for um Vampire, você o mata. Qualquer Vampire que tentar te morder também morre.",
    playTip:
      "Cace quem a cidade suspeita de ser Vampire: um acerto confirma e elimina ao mesmo tempo.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 1,
    importantInteractions: [
      "Não pode ser convertido em Vampire.",
      "Quando todos os Vampiros morrem, você vira Vigilante com apenas uma bala.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 45,
    actionDefinitions: [huntAction],
    action: huntAction,
    investigativeAppearance: investigativeAppearance("Vampire Hunter", "town"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
