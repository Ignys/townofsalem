import type { NightConsoleInteraction } from "@/features/lobby/night-console-interactions";
import type { HostNightActionEntry, PlayerNightActionSubmission } from "@/types";

import {
  hasBlockingHostActionIssues,
  validateHostNightAction,
  type HostActionValidationContext,
} from "./validate-host-night-action";

/** Id determinístico: espelhar de novo sobrescreve o mesmo nó em vez de criar entradas novas. */
export function getMirroredEntryId(actorUid: string, actionId: string): string {
  return `player-${actorUid}-${actionId}`;
}

export interface PlayerSubmissionRecord {
  actorUid: string;
  submission: PlayerNightActionSubmission;
}

export type MirrorSkipReason =
  | "no-matching-interaction"
  | "unchanged"
  | "host-override";

export interface MirrorPlan {
  entries: readonly HostNightActionEntry[];
  skipped: readonly { actorUid: string; actionId: string; reason: MirrorSkipReason }[];
}

function sameTargets(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((uid, index) => uid === right[index]);
}

/**
 * Converte submissões de jogadores em entradas do console do mestre.
 *
 * Puro: recebe as submissões observadas, as interações calculadas pelo host (com o roster
 * completo, portanto já com o ajuste de targetCount do Godfather sozinho) e as entradas
 * existentes; devolve apenas o que precisa ser escrito.
 */
export function buildMirrorPlan(
  submissions: readonly PlayerSubmissionRecord[],
  interactions: readonly NightConsoleInteraction[],
  existingEntries: readonly HostNightActionEntry[],
  context: HostActionValidationContext,
  now: number,
): MirrorPlan {
  const entries: HostNightActionEntry[] = [];
  const skipped: { actorUid: string; actionId: string; reason: MirrorSkipReason }[] = [];

  for (const { actorUid, submission } of submissions) {
    const interaction = interactions.find(
      (candidate) =>
        candidate.actor.uid === actorUid && candidate.action.id === submission.actionId,
    );

    if (!interaction) {
      skipped.push({ actorUid, actionId: submission.actionId, reason: "no-matching-interaction" });
      continue;
    }

    const id = getMirroredEntryId(actorUid, submission.actionId);
    const existing = existingEntries.find((entry) => entry.id === id);

    // Uma sobrescrita do mestre vence até o jogador enviar algo mais novo.
    if (existing?.overriddenAt !== undefined && submission.updatedAt <= existing.overriddenAt) {
      skipped.push({ actorUid, actionId: submission.actionId, reason: "host-override" });
      continue;
    }

    const targetUids = [...submission.targetUids];
    const candidate: HostNightActionEntry = {
      id,
      nightId: submission.nightId,
      ...(submission.nightNumber !== undefined ? { nightNumber: submission.nightNumber } : {}),
      actorUid,
      roleIdSnapshot: submission.roleIdSnapshot,
      actionId: submission.actionId,
      targetUids,
      createdAt: existing?.createdAt ?? submission.createdAt ?? now,
      updatedAt: now,
      status: "confirmed",
      source: "player",
      sourceUpdatedAt: submission.updatedAt,
    };
    const issues = validateHostNightAction(candidate, context);
    candidate.status = hasBlockingHostActionIssues(issues) ? "draft" : "confirmed";

    if (
      existing &&
      existing.sourceUpdatedAt === submission.updatedAt &&
      existing.status === candidate.status &&
      sameTargets(existing.targetUids as string[], targetUids)
    ) {
      skipped.push({ actorUid, actionId: submission.actionId, reason: "unchanged" });
      continue;
    }

    entries.push(candidate);
  }

  return { entries, skipped };
}
