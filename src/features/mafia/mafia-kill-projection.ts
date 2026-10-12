import { resolveMafiaVoteTarget } from "@/game-engine/role-rules";
import type { MafiaBoardPickRecord, MafiaTeamMemberRecord } from "@/types";

export const MAFIA_KILL_ACTION_ID = "mafia-kill-vote";

export interface MafiaKillTally {
  /** alvo → quem votou nele (confirmado ou não). */
  votesByTarget: Record<string, { uid: string; locked: boolean }[]>;
  /** Quem morre se a noite acabar agora (só votos confirmados contam, como no motor). */
  projectedTargetUid: string | null;
  /** Há votos confirmados empatados sem Godfather para desempatar. */
  tied: boolean;
}

/**
 * Placar do ataque da Máfia: o alvo mais votado morre; empate só se resolve pelo voto do
 * Godfather, senão ninguém morre. Mesma regra de `resolveMafiaVoteTarget` no motor.
 */
export function tallyMafiaKill(
  board: Readonly<Record<string, Readonly<Record<string, MafiaBoardPickRecord>>>>,
  team: Readonly<Record<string, MafiaTeamMemberRecord>>,
): MafiaKillTally {
  const votesByTarget: MafiaKillTally["votesByTarget"] = {};
  const lockedVotes: Record<string, string> = {};

  for (const [uid, picks] of Object.entries(board)) {
    if (!team[uid]) continue;
    const pick = picks[MAFIA_KILL_ACTION_ID];
    const targetUid = pick?.targetUids?.[0];
    if (!targetUid) continue;
    (votesByTarget[targetUid] ??= []).push({ uid, locked: Boolean(pick.locked) });
    if (pick.locked) lockedVotes[uid] = targetUid;
  }

  const godfatherUid = Object.entries(team).find(([, member]) => member.roleId === "godfather")?.[0];
  const projectedTargetUid = Object.keys(lockedVotes).length > 0
    ? resolveMafiaVoteTarget(lockedVotes, godfatherUid)
    : null;

  return {
    votesByTarget,
    projectedTargetUid,
    tied: Object.keys(lockedVotes).length > 0 && projectedTargetUid === null,
  };
}
