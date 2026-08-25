import type { RoleDefinition } from "@/types";

import { nightAction } from "./action-builders";
import {
  AMBIGUOUS_NIGHT_IMMUNITY_NOTE,
  investigativeAppearance,
  TOWN_GOAL,
} from "./role-helpers";

const alertAction = nightAction({
  id: "alert",
  label: "Entrar em Alert",
  verb: "entra em Alert",
  targetCount: 0,
  maxUses: 2,
  verificationStatus: "needs-verification",
});

const vigilanteShot = nightAction({
  id: "shoot",
  label: "Atirar",
  verb: "atira em",
  availableFromNight: 2,
  maxUses: 1,
  priority: 50,
  engineEffectType: "attack",
  engineEffectConfig: { attackLevel: "basic" },
});

export const TOWN_KILLING_ROLES = [
  {
    id: "veteran",
    name: "Veteran",
    faction: "town",
    alignment: "Town Killing",
    description:
      "Durante a noite, você pode entrar em Alert. Enquanto estiver alerta, não pode ser morto e mata qualquer pessoa que o visitar. Há dois Alerts por partida.",
    beginnerDescription:
      "O Alert protege você, mas também mata visitantes aliados. Escolha as duas noites com cuidado.",
    goal: TOWN_GOAL,
    virtueValue: 3,
    cardCount: 1,
    importantInteractions: [
      "Mata qualquer visitante durante Alert, inclusive aliados.",
      "Pode usar Alert na primeira noite e atingir uma Witch visitante.",
      AMBIGUOUS_NIGHT_IMMUNITY_NOTE,
    ],
    attack: "powerful",
    defense: "none",
    wakesAtNight: true,
    wakeOrder: 20,
    actionDefinitions: [alertAction],
    action: alertAction,
    investigativeAppearance: investigativeAppearance("Veteran", "town"),
    verificationStatus: "needs-verification",
    verificationNotes: [
      "É preciso definir qual membro da Mafia visita no ataque coletivo e a precedência contra imunidade noturna.",
    ],
  },
  {
    id: "vigilante",
    name: "Vigilante",
    faction: "town",
    alignment: "Town Killing",
    description:
      "A partir da segunda noite, escolha uma pessoa para atirar e matar. Você possui apenas um tiro durante toda a partida.",
    beginnerDescription:
      "Você tem um único tiro e não sofre a punição do jogo digital por atingir um Townie.",
    goal: TOWN_GOAL,
    virtueValue: 5,
    cardCount: 1,
    importantInteractions: [
      "Não pode matar na primeira noite.",
      "Não se suicida automaticamente se atingir uma role da Town.",
    ],
    attack: "basic",
    defense: "none",
    wakesAtNight: true,
    wakeOrder: 50,
    actionDefinitions: [vigilanteShot],
    action: vigilanteShot,
    investigativeAppearance: investigativeAppearance("Vigilante", "town"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
