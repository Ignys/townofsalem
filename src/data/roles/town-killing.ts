import type { RoleDefinition } from "@/types";

import { nightAction } from "./action-builders";
import { investigativeAppearance, TOWN_GOAL } from "./role-helpers";

const alertAction = nightAction({
  id: "alert",
  label: "Entrar em Alert",
  verb: "entra em Alert",
  targetCount: 0,
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

export const TOWN_KILLING_ROLES = [
  {
    id: "veteran",
    name: "Veteran",
    faction: "town",
    alignment: "Town Killing",
    description:
      "À noite, você pode entrar em Alert (alerta). Enquanto estiver alerta, não pode ser morto e ataca todas as pessoas que o visitarem. A quantidade total de alertas depende do número de jogadores da partida.",
    playTip:
      "O alerta protege você, mas também pode matar visitantes aliados. Escolha suas noites com cuidado.",
    goal: TOWN_GOAL,
    virtueValue: 3,
    cardCount: 1,
    importantInteractions: [
      "Mata qualquer visitante durante Alert, inclusive aliados.",
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
      "A partir da segunda noite, escolha uma pessoa para atirar e matar. A quantidade total de tiros depende do número de jogadores da partida.",
    playTip:
      "Use seus tiros com cuidado. Nesta edição, você não se mata automaticamente se atingir alguém da Town.",
    goal: TOWN_GOAL,
    virtueValue: 5,
    cardCount: 1,
    importantInteractions: [
      "Não pode matar na primeira noite.",
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
] as const satisfies readonly RoleDefinition[];
