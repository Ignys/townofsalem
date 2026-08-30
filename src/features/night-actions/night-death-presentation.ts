import type { EngineDeath, NightDeathCause, NightResolution } from "@/game-engine/types";

import {
  resolutionPlayerPart,
  resolutionTextPart,
} from "./night-resolution-message-builders";
import type {
  NightResolutionMessageLine,
  NightResolutionMessagePart,
} from "./night-resolution-message-types";

interface DeathPresentationInput {
  death: EngineDeath;
  playerNames: Readonly<Record<string, string>>;
  roleId?: string;
  resolution?: NightResolution;
  cleaned: boolean;
}

const PUBLIC_DEATH_CAUSES: Record<NightDeathCause, string> = {
  "night-attack": "um ataque noturno",
  "mafia-attack": "um ataque da Máfia",
  "veteran-attack": "o Alert de um Veteran",
  "bodyguard-counterattack": "o contra-ataque de um Bodyguard",
  "bodyguard-sacrifice": "um sacrifício durante a proteção de outra pessoa",
  "visitor-attack": "uma emboscada ao visitar uma casa vigiada",
  "witch-curse": "a maldição de uma Witch",
};

const PRIVATE_DEATH_CAUSES: Record<NightDeathCause, string> = {
  "night-attack": "ataque noturno",
  "mafia-attack": "ataque da Máfia",
  "veteran-attack": "Alert de Veteran",
  "bodyguard-counterattack": "contra-ataque de Bodyguard",
  "bodyguard-sacrifice": "sacrifício de Bodyguard",
  "visitor-attack": "emboscada a um visitante",
  "witch-curse": "maldição de Witch",
};

function roleParts(roleId?: string): NightResolutionMessagePart[] {
  return roleId
    ? [{ kind: "role", roleId }]
    : [];
}

export function presentPublicNightDeath({
  death,
  playerNames,
  roleId,
  cleaned,
}: DeathPresentationInput): NightResolutionMessageLine {
  const cause = PUBLIC_DEATH_CAUSES[death.cause];

  return {
    parts: [
      resolutionPlayerPart(death.targetUid, playerNames),
      ...(cleaned ? [] : roleParts(roleId)),
      resolutionTextPart(` morreu para ${cause}.`),
    ],
  };
}

export function presentFallbackPublicDeath(
  playerUid: string,
  playerNames: Readonly<Record<string, string>>,
  roleId: string | undefined,
  cleaned: boolean,
): NightResolutionMessageLine {
  return {
    parts: [
      resolutionPlayerPart(playerUid, playerNames),
      ...(cleaned ? [] : roleParts(roleId)),
      resolutionTextPart(" morreu."),
    ],
  };
}

export function presentPrivateNightDeath({
  death,
  playerNames,
  roleId,
  resolution,
  cleaned,
}: DeathPresentationInput): NightResolutionMessageLine {
  const originalTargetUid = death.originalTargetUid
    ?? resolution?.engineEvents?.find((event) =>
      event.type === "BODYGUARD_SACRIFICED"
      && (event.actorUid === death.targetUid || event.actionId === death.sourceActionId),
    )?.targetUid
    ?? resolution?.engineEvents?.find((event) =>
      event.type === "BODYGUARD_INTERCEPTED_ATTACK"
      && event.actionId === death.sourceActionId,
    )?.targetUid;
  const parts: NightResolutionMessagePart[] = [
    resolutionTextPart("Morte de "),
    resolutionPlayerPart(death.targetUid, playerNames),
    ...roleParts(roleId),
    resolutionTextPart(` — causa: ${PRIVATE_DEATH_CAUSES[death.cause]}.`),
  ];

  if (death.attackerUid) {
    parts.push(
      resolutionTextPart(" Responsável: "),
      resolutionPlayerPart(death.attackerUid, playerNames),
      resolutionTextPart("."),
    );
  }

  if (originalTargetUid && originalTargetUid !== death.targetUid) {
    parts.push(
      resolutionTextPart(" Alvo original do confronto: "),
      resolutionPlayerPart(originalTargetUid, playerNames),
      resolutionTextPart("."),
    );
  }

  if (cleaned) {
    parts.push(resolutionTextPart(" O corpo foi limpo pelo Janitor."));
  }

  return { parts };
}
