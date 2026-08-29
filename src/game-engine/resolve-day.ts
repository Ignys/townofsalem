import type { EngineGameState, EngineRoleChange, EngineWarning } from "./types";
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

/** How the host declares a day death in the assisted (presencial) mode. */
export type AssistedDayDeathKind = "lynch" | "other-day";

export type AssistedDayDeathCause = "hanging" | "jester-revenge" | "day-death";

export interface AssistedDayResolution {
  deaths: readonly {
    targetUid: string;
    cause: AssistedDayDeathCause;
    unavoidable: boolean;
  }[];
  individualWinnerUids: readonly string[];
  appliedStatuses: readonly { targetUid: string; statusType: string }[];
  roleChanges: readonly EngineRoleChange[];
  warnings: readonly EngineWarning[];
  /** Executioner uids whose fate the host still has to decide. */
  pendingExecutionerDecisionUids: readonly string[];
  gameEnds: boolean;
}

export interface AssistedDayDeathInput {
  targetUid: string;
  kind: AssistedDayDeathKind;
  /**
   * Assisted mode has no digital verdict votes, so the host names the revenge
   * target directly and the guilty-vote check of `resolveHanging` is skipped.
   */
  jesterRevengeTargetUid?: string;
  /**
   * Host answer for `executionerBecomesJester("other-day")`, which the rules
   * leave undefined. Omitted while the host has not decided yet.
   */
  executionerBecomesJester?: boolean;
}

function findExecutionerUids(
  gameState: EngineGameState,
  targetStatuses: readonly string[],
): readonly string[] {
  const uids: string[] = [];
  for (const status of targetStatuses) {
    if (!status.startsWith("execution-target:")) continue;
    const executionerUid = status.slice("execution-target:".length);
    const executioner = gameState.players.find(({ uid }) => uid === executionerUid);
    if (!executioner || executioner.roleId !== "executioner" || !executioner.alive) {
      continue;
    }
    uids.push(executionerUid);
  }
  return [...new Set(uids)].sort();
}

/**
 * Resolves a day death declared by the host in assisted mode.
 *
 * A lynch and any other day death are deliberately distinct: only a lynch wins
 * the game for the Executioner, while a non-lynch day death leaves the
 * Executioner's fate to the host (see `executionerBecomesJester`).
 */
export function resolveAssistedDayDeath(
  gameState: EngineGameState,
  input: AssistedDayDeathInput,
): AssistedDayResolution {
  const variants = withDefaultVariants(gameState.variants);
  const target = gameState.players.find(({ uid }) => uid === input.targetUid);
  if (!target) throw new Error("day-death-player-not-found");
  if (!target.alive) throw new Error("day-death-player-already-dead");

  const lynched = input.kind === "lynch";
  const deaths: AssistedDayResolution["deaths"][number][] = [{
    targetUid: target.uid,
    cause: lynched ? "hanging" : "day-death",
    unavoidable: true,
  }];
  const individualWinnerUids: string[] = [];
  const appliedStatuses: AssistedDayResolution["appliedStatuses"][number][] = [];
  const roleChanges: EngineRoleChange[] = [];
  const warnings: EngineWarning[] = [];
  const pendingExecutionerDecisionUids: string[] = [];
  let executionerWon = false;

  const executionerUids = findExecutionerUids(gameState, target.statuses);

  if (lynched) {
    if (target.roleId === "jester") {
      individualWinnerUids.push(target.uid);
      if (input.jesterRevengeTargetUid) {
        const revengeTarget = gameState.players.find(
          ({ uid }) => uid === input.jesterRevengeTargetUid,
        );
        if (!revengeTarget || !revengeTarget.alive) {
          warnings.push({
            code: "JESTER_REVENGE_TARGET_NOT_ALIVE",
            message: "A vingança do Jester precisa de um alvo vivo.",
          });
        } else if (revengeTarget.uid === target.uid) {
          warnings.push({
            code: "JESTER_REVENGE_TARGET_IS_THE_JESTER",
            message: "O Jester não pode escolher a si mesmo na vingança.",
          });
        } else {
          deaths.push({
            targetUid: revengeTarget.uid,
            cause: "jester-revenge",
            unavoidable: true,
          });
        }
      } else {
        warnings.push({
          code: "JESTER_REVENGE_TARGET_REQUIRED",
          message: "Escolha quem morre na vingança inevitável do Jester.",
        });
      }
    }

    // The target was lynched: every Executioner watching them wins outright.
    for (const executionerUid of executionerUids) {
      individualWinnerUids.push(executionerUid);
      executionerWon = true;
      appliedStatuses.push({ targetUid: executionerUid, statusType: "executioner-won" });
    }

    if (target.roleId === "survivor" && variants.survivorLynchBlocksTownNextNight) {
      appliedStatuses.push(...gameState.players
        .filter(({ alive, faction, uid }) => alive && faction === "town" && uid !== target.uid)
        .map(({ uid }) => ({ targetUid: uid, statusType: "town-blocked-next-night" })));
    }
  } else {
    // Not a lynch: the rules leave this to the table, so the host decides.
    for (const executionerUid of executionerUids) {
      if (input.executionerBecomesJester === undefined) {
        pendingExecutionerDecisionUids.push(executionerUid);
        warnings.push(warnAboutUnspecifiedExecutionerTargetDayDeath(target.uid));
        continue;
      }
      if (!input.executionerBecomesJester) continue;
      roleChanges.push({
        playerUid: executionerUid,
        fromRoleId: "executioner",
        toRoleId: "jester",
        reasonCode: "EXECUTIONER_TARGET_DIED_DURING_THE_DAY",
      });
    }
  }

  return {
    deaths,
    individualWinnerUids: [...new Set(individualWinnerUids)].sort(),
    appliedStatuses,
    roleChanges,
    warnings,
    pendingExecutionerDecisionUids: [...new Set(pendingExecutionerDecisionUids)].sort(),
    gameEnds: (lynched && target.roleId === "jester" && variants.jesterWinEndsGame)
      || (executionerWon && variants.executionerWinEndsGame),
  };
}
