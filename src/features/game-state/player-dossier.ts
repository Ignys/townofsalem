import { ROLE_DEFINITIONS } from "@/data/roles";
import { formatInteractionDescription } from "@/features/lobby/player-interaction-history";
import type {
  DayAnnouncementRecord,
  PlayerDawnNightResultRecord,
  PlayerInstantNightResultRecord,
  PlayerNightActionSubmission,
  PlayerNightResultLine,
} from "@/types";

export interface PlayerDossierEntry {
  key: string;
  nightNumber: number;
  /** Público: veio dos anúncios. Privado: só o jogador que olha tem essa informação. */
  visibility: "public" | "private";
  line: PlayerNightResultLine;
}

interface PlayerDossierInput {
  targetUid: string;
  /** Quem olha o próprio modal: entram também as ações sem alvo (ex.: alerta do Veteran). */
  self?: boolean;
  announcements: Readonly<Record<string, DayAnnouncementRecord>>;
  dawnResults: Readonly<Record<string, PlayerDawnNightResultRecord>>;
  instantResults: Readonly<Record<string, Readonly<Record<string, PlayerInstantNightResultRecord>>>>;
  /** Submissões do próprio jogador, por noite. */
  submissions: Readonly<Record<string, Readonly<Record<string, PlayerNightActionSubmission>>>>;
  nightNumberById: Readonly<Record<string, number>>;
  playerNames: Readonly<Record<string, string>>;
}

function mentions(line: PlayerNightResultLine, uid: string) {
  return line.parts.some((part) => part.kind === "player" && part.playerUid === uid);
}

/** Tudo o que quem olha sabe sobre um jogador, noite a noite. */
export function getPlayerDossier({
  targetUid,
  self = false,
  announcements,
  dawnResults,
  instantResults,
  submissions,
  nightNumberById,
  playerNames,
}: PlayerDossierInput): PlayerDossierEntry[] {
  const entries: PlayerDossierEntry[] = [];

  for (const [nightId, record] of Object.entries(announcements)) {
    record.lines.forEach((line, index) => {
      if (mentions(line, targetUid)) {
        entries.push({ key: `a:${nightId}:${index}`, nightNumber: record.nightNumber, visibility: "public", line });
      }
    });
  }

  for (const [nightId, actions] of Object.entries(submissions)) {
    for (const submission of Object.values(actions)) {
      if (submission.skipped) continue;
      const alert = self && submission.actionId === "alert";
      if (!alert && !submission.targetUids.includes(targetUid)) continue;
      entries.push({
        key: `s:${nightId}:${submission.actionId}`,
        nightNumber: submission.nightNumber ?? nightNumberById[nightId] ?? 0,
        visibility: "private",
        line: {
          parts: [{
            kind: "text",
            text: alert ? "Você entrou em alerta" : formatInteractionDescription(submission, playerNames, ROLE_DEFINITIONS),
          }],
        },
      });
    }
  }

  for (const [nightId, results] of Object.entries(instantResults)) {
    for (const [resultKey, result] of Object.entries(results)) {
      if (mentions(result.line, targetUid)) {
        entries.push({ key: `i:${nightId}:${resultKey}`, nightNumber: result.nightNumber, visibility: "private", line: result.line });
      }
    }
  }

  for (const [nightId, record] of Object.entries(dawnResults)) {
    record.lines.forEach((line, index) => {
      // No próprio modal entra também a troca de role (ex.: o que o Amnesiac lembrou).
      const ownRoleChange = self && line.parts.some((part) => part.kind === "role")
        && !line.parts.some((part) => part.kind === "player");
      if (ownRoleChange || mentions(line, targetUid)) {
        entries.push({ key: `d:${nightId}:${index}`, nightNumber: record.nightNumber, visibility: "private", line });
      }
    });
  }

  // Estável: dentro da noite fica a ordem acima (anúncio, ação, resultado).
  return entries.sort((left, right) => left.nightNumber - right.nightNumber);
}
