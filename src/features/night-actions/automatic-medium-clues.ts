import { createMediumClue } from "@/game-engine/medium-clue";
import {
  createRandomRecorder,
  createSeededRandomSource,
} from "@/game-engine/random";
import { getMediumClueCandidateCount } from "@/game-engine/role-resource-limits";
import type {
  EngineDeath,
  EngineMediumClue,
  EngineRandomDecision,
  NightResolution,
} from "@/game-engine/types";
import type { HostNightActionEntry, NightResolutionRecord } from "@/types";

interface AutomaticMediumCluesInput {
  gameId: string;
  nightId: string;
  playerUids: readonly string[];
  entries: readonly HostNightActionEntry[];
  previousResolutions: Readonly<Record<string, NightResolutionRecord>>;
  resolution: NightResolution;
}

interface RecordedDeath {
  death: EngineDeath;
  resolution: NightResolution;
  appliedAt: number;
}

function findLatestDeath(
  victimUid: string,
  resolutions: Readonly<Record<string, NightResolutionRecord>>,
): RecordedDeath | undefined {
  return Object.values(resolutions)
    .filter(({ rolledBackAt }) => !rolledBackAt)
    .flatMap((record) => (record.resolution.deathRecords ?? [])
      .filter(({ targetUid }) => targetUid === victimUid)
      .map((death) => ({
        death,
        resolution: record.resolution,
        appliedAt: record.appliedAt ?? record.createdAt,
      })))
    .sort((left, right) => right.appliedAt - left.appliedAt)[0];
}

function findResponsibleCandidates(recordedDeath: RecordedDeath): readonly string[] {
  if (recordedDeath.death.attackerUid) {
    return [recordedDeath.death.attackerUid];
  }

  const sourceEffect = recordedDeath.resolution.appliedEffects.find(
    ({ id }) => id === recordedDeath.death.sourceActionId,
  );
  return sourceEffect?.participantUids ?? [];
}

export function addAutomaticMediumClues({
  gameId,
  nightId,
  playerUids,
  entries,
  previousResolutions,
  resolution,
}: AutomaticMediumCluesInput): NightResolution {
  const candidateCount = getMediumClueCandidateCount(playerUids.length);
  if (!candidateCount) return resolution;

  const randomDecisions: EngineRandomDecision[] = [];
  const choose = createRandomRecorder(
    createSeededRandomSource(`${gameId}:${nightId}:medium-clues`),
    randomDecisions,
  );
  const mediumClues: EngineMediumClue[] = [];

  for (const entry of entries.filter(
    ({ roleIdSnapshot, status }) => roleIdSnapshot === "medium" && status === "confirmed",
  )) {
    const victimUid = entry.targetUids[0];
    if (!victimUid) continue;

    const recordedDeath = findLatestDeath(victimUid, previousResolutions);
    if (!recordedDeath) continue;

    const responsibleCandidates = findResponsibleCandidates(recordedDeath);
    if (responsibleCandidates.length === 0) continue;

    const responsiblePlayerUid = responsibleCandidates.length === 1
      ? responsibleCandidates[0]
      : choose(
        `medium-clue:${entry.actorUid}:${victimUid}:responsible`,
        responsibleCandidates,
      );

    try {
      const clue = createMediumClue(
        victimUid,
        responsiblePlayerUid,
        playerUids,
        candidateCount,
        choose,
      );
      mediumClues.push({ mediumUid: entry.actorUid, ...clue });
    } catch {
      // Um snapshot incompleto não deve impedir a resolução da noite.
    }
  }

  return {
    ...resolution,
    ...(mediumClues.length > 0 ? { mediumClues } : {}),
    randomDecisions: [...(resolution.randomDecisions ?? []), ...randomDecisions],
  };
}
