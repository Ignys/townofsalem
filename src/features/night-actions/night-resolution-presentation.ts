import { getRoleById } from "@/data/roles";
import type { NightResolution } from "@/game-engine/types";

import {
  presentFallbackPublicDeath,
  presentPrivateNightDeath,
  presentPublicNightDeath,
} from "./night-death-presentation";
import { presentNightResolutionEvent } from "./night-resolution-event-presentation";
import { getNightStatusLabel } from "./night-resolution-labels";
import {
  getResolutionPlayerName,
  resolutionPlayerPart,
  resolutionTextMessage,
  resolutionTextPart,
} from "./night-resolution-message-builders";
import type {
  NightResolutionMessageLine,
  NightResolutionMessagePart,
} from "./night-resolution-message-types";

export type IndividualNightMessageLine = NightResolutionMessageLine;
export type IndividualNightMessagePart = NightResolutionMessagePart;

export interface IndividualNightMessage {
  playerUid: string;
  playerName: string;
  messages: readonly IndividualNightMessageLine[];
}

export interface NightResolutionPresentation {
  announcements: readonly NightResolutionMessageLine[];
  individualMessages: readonly IndividualNightMessage[];
  hostPrivateInformation: readonly NightResolutionMessageLine[];
  resolutionDetails: readonly NightResolutionMessageLine[];
  warnings: readonly string[];
}

export function presentNightResolution(
  resolution: NightResolution,
  playerNames: Readonly<Record<string, string>>,
  assignments: Readonly<Record<string, string>> = {},
): NightResolutionPresentation {
  const deaths = resolution.deaths ?? [];
  const deathRecords = resolution.deathRecords ?? [];
  const cleanedPlayerUids = new Set(resolution.cleanedPlayerUids ?? []);
  const announcements = deaths.length === 0
    ? [resolutionTextMessage("Ninguém morreu nesta noite.")]
    : deaths.map((playerUid) => {
      const death = deathRecords.find(({ targetUid }) => targetUid === playerUid);
      const cleaned = cleanedPlayerUids.has(playerUid);

      return death
        ? presentPublicNightDeath({
          death,
          playerNames,
          roleId: assignments[playerUid],
          resolution,
          cleaned,
        })
        : presentFallbackPublicDeath(
          playerUid,
          playerNames,
          assignments[playerUid],
          cleaned,
        );
    });

  const messagesByPlayer = new Map<string, IndividualNightMessageLine[]>();
  const addIndividualMessage = (
    playerUid: string,
    message: IndividualNightMessageLine,
  ) => {
    messagesByPlayer.set(playerUid, [
      ...(messagesByPlayer.get(playerUid) ?? []),
      message,
    ]);
  };

  (resolution.survivors ?? []).forEach(({ targetUid }) => {
    addIndividualMessage(
      targetUid,
      resolutionTextMessage("Foi atacado nesta noite, mas sobreviveu."),
    );
  });
  (resolution.investigationResults ?? []).forEach((result) => {
    addIndividualMessage(result.actorUid, {
      parts: [
        resolutionTextPart("Investigou "),
        resolutionPlayerPart(result.targetUid, playerNames),
        resolutionTextPart(`: informe ${result.result}.`),
      ],
    });
  });
  (resolution.roleChanges ?? []).forEach((change) => {
    const roleName = getRoleById(change.toRoleId)?.name ?? change.toRoleId;
    addIndividualMessage(
      change.playerUid,
      resolutionTextMessage(`Sua nova role é ${roleName}.`),
    );
  });
  (resolution.individualWinnerUids ?? []).forEach((playerUid) => {
    addIndividualMessage(
      playerUid,
      resolutionTextMessage("Cumpriu sua condição individual de vitória."),
    );
  });
  (resolution.mediumClues ?? []).forEach((clue) => {
    const candidateParts = clue.candidateUids.flatMap((candidateUid, index) => [
      ...(index > 0 ? [resolutionTextPart(", ")] : []),
      resolutionPlayerPart(
        candidateUid,
        playerNames,
        candidateUid === clue.responsiblePlayerUid ? "danger" : undefined,
      ),
    ]);
    addIndividualMessage(clue.mediumUid, {
      parts: [
        resolutionTextPart("Consultou "),
        resolutionPlayerPart(clue.victimUid, playerNames),
        resolutionTextPart(": os suspeitos são "),
        ...candidateParts,
        resolutionTextPart(". Um deles foi responsável pela morte."),
      ],
    });
  });

  const individualMessages = [...messagesByPlayer].map(([playerUid, messages]) => ({
    playerUid,
    playerName: getResolutionPlayerName(playerUid, playerNames),
    messages,
  }));

  const hostPrivateInformation: NightResolutionMessageLine[] = deathRecords.map((death) =>
    presentPrivateNightDeath({
      death,
      playerNames,
      roleId: assignments[death.targetUid],
      resolution,
      cleaned: cleanedPlayerUids.has(death.targetUid),
    }),
  );

  (resolution.appliedStatuses ?? []).forEach((status) => {
    hostPrivateInformation.push({
      parts: [
        resolutionPlayerPart(status.targetUid, playerNames),
        resolutionTextPart(` ficou ${getNightStatusLabel(status.statusType)}.`),
      ],
    });
  });
  (resolution.removedStatuses ?? []).forEach((status) => {
    hostPrivateInformation.push({
      parts: [
        resolutionPlayerPart(status.targetUid, playerNames),
        resolutionTextPart(` perdeu o status ${getNightStatusLabel(status.statusType)}.`),
      ],
    });
  });
  (resolution.consumedResources ?? []).forEach((consumption) => {
    hostPrivateInformation.push({
      parts: [
        resolutionPlayerPart(consumption.playerUid, playerNames),
        resolutionTextPart(` consumiu ${consumption.amount} uso de ${consumption.resource}.`),
      ],
    });
  });
  (resolution.randomDecisions ?? []).forEach((decision) => {
    if (decision.key.startsWith("amnesiac-role:")) {
      const selectedRole = getRoleById(decision.selectedUid)?.name ?? decision.selectedUid;
      const candidates = decision.candidateUids
        .map((roleId) => getRoleById(roleId)?.name ?? roleId)
        .join(", ");
      hostPrivateInformation.push(resolutionTextMessage(
        `Sorteio do Amnesiac: ${selectedRole} foi selecionado entre ${candidates}.`,
      ));
      return;
    }

    if (decision.key.startsWith("bodyguard-intercept:")) {
      hostPrivateInformation.push(resolutionTextMessage(
        "Havia mais de um ataque possível para o Bodyguard interceptar; o motor sorteou um deles.",
      ));
    }
  });

  const resolutionDetails = (resolution.engineEvents ?? [])
    .map((event) => presentNightResolutionEvent(event, playerNames))
    .filter((line): line is NightResolutionMessageLine => line !== null);

  return {
    announcements,
    individualMessages,
    hostPrivateInformation,
    resolutionDetails,
    warnings: (resolution.warnings ?? []).map(({ message }) => message),
  };
}
