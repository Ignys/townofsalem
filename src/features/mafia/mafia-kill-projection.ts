import { resolveMafiaVoteTarget } from "@/game-engine/role-rules";
import type { MafiaBoardPickRecord, MafiaTeamMemberRecord } from "@/types";

export const MAFIA_KILL_ACTION_ID = "mafia-kill-vote";

export interface MafiaKillTally {
  /** alvo → quem votou nele. */
  votesByTarget: Record<string, { uid: string; locked: boolean }[]>;
  /** Quem morre se a noite acabar agora: a escolha salva de cada um é o voto dele. */
  projectedTargetUid: string | null;
  /** Há votos empatados sem Godfather para desempatar. */
  tied: boolean;
}

/**
 * Placar do ataque da Máfia: o alvo mais votado morre; empate só se resolve pelo voto do
 * Godfather, senão o motor sorteia um dos empatados ao fim da noite (aqui fica `tied`).
 */
export function tallyMafiaKill(
  board: Readonly<Record<string, Readonly<Record<string, MafiaBoardPickRecord>>>>,
  team: Readonly<Record<string, MafiaTeamMemberRecord>>,
): MafiaKillTally {
  const votesByTarget: MafiaKillTally["votesByTarget"] = {};
  const votes: Record<string, string> = {};

  for (const [uid, picks] of Object.entries(board)) {
    if (!team[uid]) continue;
    const pick = picks[MAFIA_KILL_ACTION_ID];
    const targetUid = pick?.targetUids?.[0];
    if (!targetUid) continue;
    (votesByTarget[targetUid] ??= []).push({ uid, locked: Boolean(pick.locked) });
    votes[uid] = targetUid;
  }

  const godfatherUid = Object.entries(team).find(([, member]) => member.roleId === "godfather")?.[0];
  const projectedTargetUid = Object.keys(votes).length > 0
    ? resolveMafiaVoteTarget(votes, godfatherUid)
    : null;

  return {
    votesByTarget,
    projectedTargetUid,
    tied: Object.keys(votes).length > 0 && projectedTargetUid === null,
  };
}
