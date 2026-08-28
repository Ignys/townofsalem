import { ROLE_DEFINITIONS } from "@/data/roles";
import {
  adaptHostActions,
  createEngineGameState,
} from "@/game-engine/host-action-adapter";
import { resolveNight } from "@/game-engine/resolve-night";
import type { NightResolution } from "@/game-engine/types";
import type { GameVariants } from "@/game-engine/variants";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";
import type { HostNightActionEntry, NightResolutionRecord, Player } from "@/types";

import { addAutomaticMediumClues } from "./automatic-medium-clues";
import {
  validateHostNightAction,
  type HostActionValidationIssue,
} from "./validate-host-night-action";

export interface NightResolutionPreviewState {
  id: string;
  actionsRevision: number;
  createdAt: number;
  resolution: NightResolution;
}

export interface NightResolutionPreviewIssue extends HostActionValidationIssue {
  entryId: string;
}

interface CalculateNightResolutionPreviewInput {
  gameId: string;
  nightId: string;
  nightNumber: number;
  actionsRevision: number;
  previewEpoch: number;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  privatePlayers: Readonly<Record<string, PrivatePlayerRecord>>;
  entries: readonly HostNightActionEntry[];
  actionHistory: readonly HostNightActionEntry[];
  variants: GameVariants;
  amnesiacRolePool: readonly string[];
  previousResolutions?: Readonly<Record<string, NightResolutionRecord>>;
}

export interface NightResolutionPreviewCalculation {
  preview: NightResolutionPreviewState | null;
  validationIssues: readonly NightResolutionPreviewIssue[];
}

export function calculateNightResolutionPreview({
  gameId,
  nightId,
  nightNumber,
  actionsRevision,
  previewEpoch,
  players,
  assignments,
  privatePlayers,
  entries,
  actionHistory,
  variants,
  amnesiacRolePool,
  previousResolutions = {},
}: CalculateNightResolutionPreviewInput): NightResolutionPreviewCalculation {
  const confirmedEntries = entries.filter(({ status }) => status === "confirmed");
  const validationContext = {
    players,
    assignments,
    roleDefinitions: ROLE_DEFINITIONS,
    nightId,
    nightNumber,
    actionEntries: actionHistory,
    variants,
  };
  const validationIssues = confirmedEntries.flatMap((entry) =>
    validateHostNightAction(entry, validationContext).map((issue) => ({
      ...issue,
      entryId: entry.id,
    })),
  );

  if (validationIssues.some(({ severity }) => severity === "error")) {
    return { preview: null, validationIssues };
  }

  const adapted = adaptHostActions(confirmedEntries, ROLE_DEFINITIONS);
  const engineState = createEngineGameState({
    gameId,
    nightId,
    nightNumber,
    players,
    assignments,
    privatePlayerStates: privatePlayers,
    roleDefinitions: ROLE_DEFINITIONS,
    variants,
    amnesiacRolePool,
  });
  const resolution = addAutomaticMediumClues({
    gameId,
    nightId,
    playerUids: players.map(({ uid }) => uid),
    entries: confirmedEntries,
    previousResolutions,
    resolution: resolveNight(engineState, adapted.actions),
  });

  return {
    validationIssues,
    preview: {
      id: `${nightId}-${actionsRevision}-${previewEpoch}`,
      actionsRevision,
      createdAt: previewEpoch,
      resolution: {
        ...resolution,
        warnings: [...adapted.warnings, ...resolution.warnings],
        partial: resolution.partial || adapted.warnings.length > 0,
      },
    },
  };
}

export function getNightResolutionPreviewEpoch(
  nightStartedAt: number,
  rolledBackAt: number | null | undefined,
  entries: readonly HostNightActionEntry[],
): number {
  return Math.max(
    nightStartedAt,
    rolledBackAt ?? 0,
    ...entries.map(({ updatedAt }) => updatedAt),
  );
}
