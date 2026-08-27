import type { NightResolution } from "@/game-engine/types";

export interface NightResolutionPresentation {
  summary: readonly string[];
  details: readonly string[];
  warnings: readonly string[];
}

const DEATH_REASONS: Readonly<Record<string, string>> = {
  "night-attack": "ataque noturno",
  "mafia-attack": "ataque coletivo da Mafia",
  "veteran-attack": "ataque do Veteran em Alert",
  "bodyguard-counterattack": "contra-ataque do Bodyguard",
  "bodyguard-sacrifice": "sacrifício do Bodyguard",
  "witch-curse": "efeito inevitável da Curse",
};

export function presentNightResolution(
  resolution: NightResolution,
  playerNames: Readonly<Record<string, string>>,
): NightResolutionPresentation {
  const name = (uid?: string) =>
    uid ? playerNames[uid] ?? `Jogador ${uid}` : "Jogador desconhecido";
  const deaths = resolution.deaths ?? [];
  const survivors = resolution.survivors ?? [];
  const investigations = resolution.investigationResults ?? [];
  const statuses = resolution.appliedStatuses ?? [];
  const deathRecords = resolution.deathRecords ?? [];
  const summary = deaths.length === 0
    ? ["Ninguém morreu nesta noite."]
    : deaths.map((uid) => {
      const record = deathRecords.find(({ targetUid }) => targetUid === uid);
      return record
        ? `${name(uid)} morreu por ${DEATH_REASONS[record.cause] ?? record.cause}.`
        : `${name(uid)} morreu.`;
    });

  summary.push(...survivors.map((survival) =>
    `${name(survival.targetUid)} foi atacado, mas sobreviveu.`,
  ));
  summary.push(...investigations.map((result) =>
    `${name(result.actorUid)} investigou ${name(result.targetUid)}: informe ${result.result}.`,
  ));
  summary.push(...statuses.map((status) =>
    `${name(status.targetUid)} recebeu o status ${status.statusType}.`,
  ));

  const details = (resolution.engineEvents ?? []).map((event) => {
    const actor = event.actorUid ? name(event.actorUid) : null;
    const target = event.targetUid ? name(event.targetUid) : null;
    return [actor, event.type, target, `(${event.reasonCode})`]
      .filter(Boolean)
      .join(" — ");
  });
  details.push(...(resolution.randomDecisions ?? []).map((decision) => {
    if (decision.key.startsWith("bodyguard-intercept:")) {
      return `Sorteio do Bodyguard: ataque ${decision.selectedUid} interceptado entre ${decision.candidateUids.join(", ")}.`;
    }

    if (decision.key.startsWith("amnesiac-role:")) {
      return `Sorteio do Amnesiac: role ${decision.selectedUid} entre ${decision.candidateUids.join(", ")}.`;
    }

    return `Sorteio ${decision.key}: ${name(decision.selectedUid)} entre ${decision.candidateUids.map((uid) => name(uid)).join(", ")}.`;
  }));

  return {
    summary,
    details,
    warnings: (resolution.warnings ?? []).map(({ code, message }) =>
      `${code}: ${message}`,
    ),
  };
}
