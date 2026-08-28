import type {
  EngineDeath,
  NightDeathCause,
  NightResolution,
} from "@/game-engine/types";

interface NightDeathContext {
  originalAttackCause?: NightDeathCause;
  originalTargetUid?: string;
}

interface FormatNightDeathDescriptionInput {
  death: EngineDeath;
  playerNames: Readonly<Record<string, string>>;
  resolution?: NightResolution;
  includeVictimName?: boolean;
}

function playerName(
  uid: string | undefined,
  playerNames: Readonly<Record<string, string>>,
): string | undefined {
  return uid ? playerNames[uid] ?? `Jogador ${uid}` : undefined;
}

function getBodyguardContext(
  death: EngineDeath,
  resolution?: NightResolution,
): NightDeathContext {
  const sacrificeEvent = resolution?.engineEvents?.find((event) =>
    event.type === "BODYGUARD_SACRIFICED"
    && (
      event.actorUid === death.targetUid
      || event.actionId === death.sourceActionId
    ),
  );
  const interceptedEvent = resolution?.engineEvents?.find((event) =>
    event.type === "BODYGUARD_INTERCEPTED_ATTACK"
    && event.actionId === death.sourceActionId,
  );
  const interceptedActionId = typeof interceptedEvent?.details?.interceptedActionId === "string"
    ? interceptedEvent.details.interceptedActionId
    : undefined;
  const interceptedEffect = resolution?.appliedEffects?.find(
    ({ id }) => id === interceptedActionId,
  );
  const inferredAttackCause = interceptedEffect
    ? interceptedEffect.actionId === "mafia-attack" || interceptedEffect.sourceFaction === "mafia"
      ? "mafia-attack"
      : "night-attack"
    : undefined;

  return {
    originalTargetUid: death.originalTargetUid
      ?? sacrificeEvent?.targetUid
      ?? interceptedEvent?.targetUid,
    originalAttackCause: death.originalAttackCause ?? inferredAttackCause,
  };
}

function describeBodyguardSacrifice(
  attackerName: string | undefined,
  protectedName: string | undefined,
  originalAttackCause: NightDeathCause | undefined,
): string {
  const protecting = protectedName ? ` protegendo ${protectedName}` : "";

  if (originalAttackCause === "mafia-attack") {
    return attackerName
      ? `para ${attackerName} pela Mafia${protecting}`
      : `pela Mafia${protecting}`;
  }

  return attackerName
    ? `para ${attackerName}${protecting}`
    : `ao proteger outra pessoa${protecting}`;
}

export function formatNightDeathDescription({
  death,
  playerNames,
  resolution,
  includeVictimName = false,
}: FormatNightDeathDescriptionInput): string {
  const subject = includeVictimName
    ? `${playerName(death.targetUid, playerNames)} morreu`
    : "Morreu";
  const attackerName = playerName(death.attackerUid, playerNames);

  switch (death.cause) {
    case "mafia-attack":
      return attackerName
        ? `${subject} para ${attackerName} pela Mafia.`
        : `${subject} pela Mafia.`;
    case "bodyguard-sacrifice": {
      const context = getBodyguardContext(death, resolution);
      const protectedName = playerName(context.originalTargetUid, playerNames);
      return `${subject} ${describeBodyguardSacrifice(
        attackerName,
        protectedName,
        context.originalAttackCause,
      )}.`;
    }
    case "bodyguard-counterattack": {
      const context = getBodyguardContext(death, resolution);
      const intendedTargetName = playerName(context.originalTargetUid, playerNames);
      if (attackerName && intendedTargetName) {
        return `${subject} para ${attackerName} atacando ${intendedTargetName}.`;
      }
      return attackerName
        ? `${subject} para ${attackerName} no contra-ataque do Bodyguard.`
        : `${subject} no contra-ataque de um Bodyguard.`;
    }
    case "veteran-attack":
      return attackerName
        ? `${subject} para ${attackerName} ao visitá-lo durante o Alert.`
        : `${subject} ao visitar um Veteran durante o Alert.`;
    case "witch-curse":
      return attackerName
        ? `${subject} para ${attackerName} pela maldição da Witch.`
        : `${subject} pela maldição de uma Witch.`;
    case "night-attack":
      return attackerName
        ? `${subject} para ${attackerName} em um ataque noturno.`
        : `${subject} em um ataque noturno.`;
  }
}

export function getNightDeathOriginalTargetUid(
  death: EngineDeath,
  resolution?: NightResolution,
): string | undefined {
  return getBodyguardContext(death, resolution).originalTargetUid;
}
