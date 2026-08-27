import type { EngineGameState, EngineWarning } from "./types";
import { resolveJesterRevenge } from "./day-effects";
import { withDefaultVariants } from "./variants";
import type { VerdictVote } from "@/lib/firebase/schema";

export interface DayResolution {
  deaths: readonly {
    targetUid: string;
    cause: "hanging" | "jester-revenge";
    unavoidable: boolean;
  }[];
  individualWinnerUids: readonly string[];
  appliedStatuses: readonly { targetUid: string; statusType: string }[];
  warnings: readonly EngineWarning[];
  gameEnds: boolean;
}

export function resolveHanging(
  gameState: EngineGameState,
  hangedPlayerUid: string,
  verdictVotes: Readonly<Record<string, VerdictVote>>,
  jesterRevengeTargetUid?: string,
): DayResolution {
  const variants = withDefaultVariants(gameState.variants);
  const hanged = gameState.players.find(({ uid }) => uid === hangedPlayerUid);
  if (!hanged) throw new Error("hanged-player-not-found");

  const deaths: DayResolution["deaths"][number][] = [{
    targetUid: hangedPlayerUid,
    cause: "hanging",
    unavoidable: true,
  }];
  const individualWinnerUids: string[] = [];
  let executionerWon = false;
  const appliedStatuses: DayResolution["appliedStatuses"][number][] = [];
  const warnings: EngineWarning[] = [];

  if (hanged.roleId === "jester") {
    individualWinnerUids.push(hanged.uid);
    if (jesterRevengeTargetUid) {
      const revenge = resolveJesterRevenge(verdictVotes, jesterRevengeTargetUid);
      if (revenge.valid && revenge.killedPlayerUid) {
        deaths.push({
          targetUid: revenge.killedPlayerUid,
          cause: "jester-revenge",
          unavoidable: true,
        });
      } else {
        warnings.push({
          code: revenge.reasonCode,
          message: "A vingança do Jester só pode escolher quem votou Guilty.",
        });
      }
    } else {
      warnings.push({
        code: "JESTER_REVENGE_TARGET_REQUIRED",
        message: "Escolha uma pessoa que votou Guilty para a vingança inevitável.",
      });
    }
  }

  for (const status of hanged.statuses) {
    if (!status.startsWith("execution-target:")) continue;
    const executionerUid = status.slice("execution-target:".length);
    individualWinnerUids.push(executionerUid);
    executionerWon = true;
    appliedStatuses.push({ targetUid: executionerUid, statusType: "executioner-won" });
  }

  if (hanged.roleId === "survivor" && variants.survivorLynchBlocksTownNextNight) {
    appliedStatuses.push(...gameState.players
      .filter(({ alive, faction, uid }) => alive && faction === "town" && uid !== hanged.uid)
      .map(({ uid }) => ({ targetUid: uid, statusType: "town-blocked-next-night" })));
  }

  return {
    deaths,
    individualWinnerUids: [...new Set(individualWinnerUids)].sort(),
    appliedStatuses,
    warnings,
    gameEnds: (hanged.roleId === "jester" && variants.jesterWinEndsGame)
      || (executionerWon && variants.executionerWinEndsGame),
  };
}

export function warnAboutUnspecifiedExecutionerTargetDayDeath(
  targetUid: string,
): EngineWarning {
  return {
    code: "EXECUTIONER_TARGET_OTHER_DAY_DEATH_REQUIRES_HOST_DECISION",
    message: `A morte diurna não causada por enforcamento de ${targetUid} exige uma decisão manual do mestre.`,
  };
}
