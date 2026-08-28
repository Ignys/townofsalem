import type { RoleDefinition } from "@/types";

import { nightAction } from "./action-builders";
import { investigativeAppearance, TOWN_GOAL } from "./role-helpers";

const bodyguardProtection = nightAction({
  id: "guard",
  label: "Proteger com sacrifício",
  verb: "protege",
  priority: 30,
  engineEffectType: "protect",
  engineEffectConfig: { protectionType: "bodyguard" },
});

const doctorProtection = nightAction({
  id: "protect",
  label: "Curar",
  verb: "cura",
  priority: 30,
  engineEffectType: "protect",
  engineEffectConfig: {
    protectionType: "doctor",
    blockedByTargetStatuses: ["mayor-revealed"],
  },
});

export const TOWN_PROTECTIVE_ROLES = [
  {
    id: "bodyguard",
    name: "Bodyguard",
    faction: "town",
    alignment: "Town Protective",
    description:
      "Toda noite, escolha alguém para proteger. Se essa pessoa for atacada, você impede um dos ataques e enfrenta o atacante: vocês atacam um ao outro.",
    playTip:
      "Proteja quem parece importante. Se essa pessoa sofrer um ataque, você se sacrifica e tenta levar o atacante junto.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 1,
    importantInteractions: [
      "Intercepta somente um ataque; ataques adicionais continuam contra o protegido.",
      "Contra a Mafia, o contra-ataque escolhe aleatoriamente um participante vivo.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 30,
    actionDefinitions: [bodyguardProtection],
    action: bodyguardProtection,
    investigativeAppearance: investigativeAppearance("Bodyguard", "town"),
    verificationStatus: "verified",
  },
  {
    id: "doctor",
    name: "Doctor",
    faction: "town",
    alignment: "Town Protective",
    description:
      "Toda noite, escolha uma pessoa para curar. Se ela for atacada naquela noite, a cura impede essa morte. Você não pode curar um Mayor que já revelou sua role.",
    playTip:
      "Escolha uma pessoa por noite para impedir que uma tentativa de morte noturna a elimine.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 1,
    importantInteractions: [
      "Um Mayor já revelado não pode ser curado.",
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 30,
    actionDefinitions: [doctorProtection],
    action: doctorProtection,
    investigativeAppearance: investigativeAppearance("Doctor", "town"),
    verificationStatus: "verified",
  },
] as const satisfies readonly RoleDefinition[];
