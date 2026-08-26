import type { RoleDefinition } from "@/types";

import { nightAction } from "./action-builders";
import {
  NIGHT_IMMUNITY_RULE,
  investigativeAppearance,
  TOWN_GOAL,
} from "./role-helpers";

const bodyguardProtection = nightAction({
  id: "guard",
  label: "Proteger com sacrifício",
  verb: "protege",
  priority: 30,
  verificationStatus: "needs-verification",
});

const doctorProtection = nightAction({
  id: "protect",
  label: "Curar",
  verb: "cura",
  priority: 30,
  engineEffectType: "protect",
  engineEffectConfig: {
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
      "Toda noite, escolha alguém para proteger. Se essa pessoa for atacada, ela sobrevive e, no lugar dela, você e o atacante morrem.",
    beginnerDescription:
      "Proteja quem parece importante. Se essa pessoa sofrer um ataque, você se sacrifica e tenta levar o atacante junto.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 1,
    importantInteractions: [
      "O protegido não morre pelo ataque que dispara a proteção.",
      NIGHT_IMMUNITY_RULE,
    ],
    canDieAtNight: true,
    wakesAtNight: true,
    wakeOrder: 30,
    actionDefinitions: [bodyguardProtection],
    action: bodyguardProtection,
    investigativeAppearance: investigativeAppearance("Bodyguard", "town"),
    verificationStatus: "needs-verification",
    verificationNotes: [
      "As mortes de sacrifício do Bodyguard ainda não são resolvidas automaticamente.",
    ],
  },
  {
    id: "doctor",
    name: "Doctor",
    faction: "town",
    alignment: "Town Protective",
    description:
      "Toda noite, escolha uma pessoa para curar. Se ela for atacada durante a mesma noite, não morrerá por causa desse ataque.",
    beginnerDescription:
      "Escolha uma pessoa por noite para impedir que uma tentativa de morte noturna a elimine.",
    goal: TOWN_GOAL,
    virtueValue: 4,
    cardCount: 1,
    importantInteractions: [
      "Um Mayor já revelado não pode ser curado.",
      "A interação com a morte de sacrifício do Bodyguard depende da regra adotada pelo grupo.",
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
