import { getRoleById } from "@/data/roles";
import type { InvestigationResult, NightResolution } from "@/game-engine/types";

import {
  resolutionPlayerPart,
  resolutionTextMessage,
  resolutionTextPart,
} from "./night-resolution-message-builders";
import type {
  NightResolutionMessageLine,
  NightResolutionMessagePart,
} from "./night-resolution-message-types";

/**
 * Resultado que só depende da própria ação: investigações e pistas do Medium. Entra no
 * resultado do amanhecer junto com o resto.
 */
export interface PlayerInstantNightResult {
  key: string;
  line: NightResolutionMessageLine;
}

const SHERIFF_RESULT_LABELS: Readonly<Record<string, string>> = {
  Good: "não suspeito",
  Evil: "suspeito",
};

function investigationResultParts(result: InvestigationResult): NightResolutionMessagePart[] {
  const role = getRoleById(result.result);
  if (role) return [resolutionTextPart(": "), { kind: "role", roleId: role.id }];

  const label = result.investigationType === "sheriff"
    ? SHERIFF_RESULT_LABELS[result.result] ?? result.result
    : result.result;
  return [resolutionTextPart(`: ${label}.`)];
}

export function buildPlayerInstantNightResults(
  resolution: NightResolution,
  actorUid: string,
  playerNames: Readonly<Record<string, string>>,
): PlayerInstantNightResult[] {
  const investigations = (resolution.investigationResults ?? [])
    .filter((result) => result.actorUid === actorUid)
    .map((result) => ({
      key: `investigation-${result.sourceActionId}`,
      line: {
        parts: [
          resolutionTextPart("Você investigou "),
          resolutionPlayerPart(result.targetUid, playerNames),
          ...investigationResultParts(result),
        ],
      },
    }));

  // Sem destacar o responsável: isso é informação só do mestre.
  const mediumClues = (resolution.mediumClues ?? [])
    .filter((clue) => clue.mediumUid === actorUid)
    .map((clue) => ({
      key: `medium-${clue.victimUid}`,
      line: {
        parts: [
          resolutionTextPart("Você consultou "),
          resolutionPlayerPart(clue.victimUid, playerNames),
          resolutionTextPart(": os suspeitos são "),
          ...clue.candidateUids.flatMap((candidateUid, index) => [
            ...(index > 0 ? [resolutionTextPart(", ")] : []),
            resolutionPlayerPart(candidateUid, playerNames),
          ]),
          resolutionTextPart(". Um deles foi responsável pela morte."),
        ],
      },
    }));

  return [...investigations, ...mediumClues];
}

/**
 * O que cada jogador descobre ao amanhecer: o que depende da ordem das ações
 * (morte, ataque sobrevivido, bloqueio, proteção) só se resolve no fim da noite.
 */
export function buildPlayerDawnNightResults(
  resolution: NightResolution,
  playerNames: Readonly<Record<string, string>>,
): Record<string, NightResolutionMessageLine[]> {
  const linesByPlayer: Record<string, NightResolutionMessageLine[]> = {};
  const add = (playerUid: string, line: NightResolutionMessageLine) => {
    (linesByPlayer[playerUid] ??= []).push(line);
  };
  const deaths = new Set(resolution.deaths ?? []);
  const deathRecords = resolution.deathRecords ?? [];
  const effectsById = new Map((resolution.appliedEffects ?? []).map((effect) => [effect.id, effect]));
  const events = resolution.engineEvents ?? [];

  deaths.forEach((playerUid) => {
    const sacrifice = deathRecords.find(
      (death) => death.targetUid === playerUid && death.cause === "bodyguard-sacrifice",
    );
    add(playerUid, sacrifice?.originalTargetUid
      ? {
        parts: [
          resolutionTextPart("Você morreu nesta noite protegendo ", "danger"),
          resolutionPlayerPart(sacrifice.originalTargetUid, playerNames),
          resolutionTextPart(".", "danger"),
        ],
      }
      : { parts: [resolutionTextPart("Você morreu nesta noite.", "danger")] });
  });

  (resolution.survivors ?? []).forEach((survival) => {
    if (deaths.has(survival.targetUid)) return;
    // Como no jogo original: quem sobreviveu sabe se foi curado ou protegido, mas não por quem.
    const protections = new Set(
      survival.sourceActionIds.map((actionId) => effectsById.get(actionId)?.protectionType),
    );
    add(survival.targetUid, resolutionTextMessage(
      protections.has("doctor")
        ? "Você foi atacado nesta noite, mas um Doctor te curou!"
        : protections.has("bodyguard")
          ? "Você foi atacado nesta noite, mas alguém te protegeu!"
          : "Você foi atacado nesta noite, mas sobreviveu.",
    ));

    const doctorUids = new Set(
      survival.sourceActionIds
        .map((actionId) => effectsById.get(actionId))
        .filter((effect) => effect?.protectionType === "doctor")
        .map((effect) => effect!.actorUid),
    );
    doctorUids.forEach((doctorUid) => {
      if (doctorUid === survival.targetUid) return;
      add(doctorUid, {
        parts: [
          resolutionTextPart("Seu alvo "),
          resolutionPlayerPart(survival.targetUid, playerNames),
          resolutionTextPart(" foi atacado e você o salvou."),
        ],
      });
    });
  });

  // Bodyguard que interceptou e foi salvo pelo Doctor (variante): a morte não aconteceu.
  events
    .filter((event) =>
      event.type === "DOCTOR_PREVENTED_DEATH"
      && event.reasonCode === "BODYGUARD_SACRIFICE_HEALED_BY_VARIANT"
      && event.targetUid
      && event.actionId,
    )
    .forEach((event) => {
      const protectedUid = effectsById.get(event.actionId!)?.targetUids[0];
      if (!protectedUid) return;
      add(event.targetUid!, {
        parts: [
          resolutionTextPart("Você interceptou um ataque contra "),
          resolutionPlayerPart(protectedUid, playerNames),
          resolutionTextPart("."),
        ],
      });
    });

  const roleblocked = new Set(
    events
      .filter((event) => event.type === "PLAYER_ROLEBLOCKED" && event.targetUid)
      .map((event) => event.targetUid!),
  );
  roleblocked.forEach((playerUid) => {
    add(playerUid, resolutionTextMessage("Você foi bloqueado nesta noite e sua ação não teve efeito."));
  });

  (resolution.roleChanges ?? []).forEach((change) => {
    const role = getRoleById(change.toRoleId);
    add(change.playerUid, role
      ? { parts: [resolutionTextPart("Sua nova role é"), { kind: "role", roleId: role.id }] }
      : resolutionTextMessage(`Sua nova role é ${change.toRoleId}.`));
  });

  (resolution.individualWinnerUids ?? []).forEach((playerUid) => {
    add(playerUid, resolutionTextMessage("Você cumpriu sua condição individual de vitória."));
  });

  // Investigações e pistas também só chegam ao amanhecer: até lá a escolha ainda pode mudar.
  new Set([
    ...(resolution.investigationResults ?? []).map(({ actorUid }) => actorUid),
    ...(resolution.mediumClues ?? []).map(({ mediumUid }) => mediumUid),
  ]).forEach((actorUid) => {
    buildPlayerInstantNightResults(resolution, actorUid, playerNames).forEach(({ line }) => add(actorUid, line));
  });

  return linesByPlayer;
}
