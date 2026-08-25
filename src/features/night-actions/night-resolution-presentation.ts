import type { NightResolution } from "@/game-engine/types";

export interface NightResolutionPresentation {
  summary: readonly string[];
  details: readonly string[];
  warnings: readonly string[];
}

export function presentNightResolution(
  resolution: NightResolution,
  playerNames: Readonly<Record<string, string>>,
): NightResolutionPresentation {
  const name = (uid?: string) => (uid ? playerNames[uid] ?? `Jogador ${uid}` : "Jogador desconhecido");
  const deaths = resolution.deaths ?? [];
  const survivors = resolution.survivors ?? [];
  const investigationResults = resolution.investigationResults ?? [];
  const appliedStatuses = resolution.appliedStatuses ?? [];
  const engineEvents = resolution.engineEvents ?? [];
  const resolutionWarnings = resolution.warnings ?? [];
  const summary = deaths.length === 0
    ? ["Ninguém morreu nesta noite."]
    : deaths.map((uid) => `${name(uid)} morreu.`);

  summary.push(...survivors.map((survival) => `${name(survival.targetUid)} foi atacado, mas sobreviveu.`));
  summary.push(...investigationResults.map((result) => `${name(result.actorUid)} investigou ${name(result.targetUid)}: informe ${result.result}.`));
  summary.push(
    ...appliedStatuses.map(
      (status) => `${name(status.targetUid)} recebeu o status ${status.statusType}.`,
    ),
  );

  const details = engineEvents.map((event) => {
    const actor = event.actorUid ? name(event.actorUid) : null;
    const target = event.targetUid ? name(event.targetUid) : null;
    return [actor, event.type, target, `(${event.reasonCode})`].filter(Boolean).join(" — ");
  });

  return {
    summary,
    details,
    warnings: resolutionWarnings.map(({ code, message }) => `${code}: ${message}`),
  };
}
