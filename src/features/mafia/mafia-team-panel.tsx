"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { getRoleById } from "@/data/roles";
import { PlayerRoleTag } from "@/features/roles/player-role-tag";
import { firebasePaths } from "@/lib/firebase/paths";
import {
  applyAtomicUpdate,
  observeMafiaBoard,
  observeMafiaReactions,
  observeMafiaTeam,
} from "@/lib/firebase/realtime-database-repository";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { MafiaBoardPickRecord, MafiaReactionRecord, MafiaTeamMemberRecord } from "@/types";

import { MAFIA_KILL_ACTION_ID, tallyMafiaKill } from "./mafia-kill-projection";

export const MAFIA_REACTIONS: readonly { key: string; label: string }[] = [
  { key: "trust", label: "Confia em mim" },
  { key: "no", label: "NÃOOO 😱" },
  { key: "go", label: "Vamos nele 🔪" },
  { key: "wait", label: "Espera ✋" },
  { key: "changed", label: "Mudei de ideia" },
  { key: "ok", label: "👍" },
];
const REACTION_LABELS = Object.fromEntries(MAFIA_REACTIONS.map(({ key, label }) => [key, label]));
const VISIBLE_REACTIONS = 6;

type Board = Record<string, Record<string, MafiaBoardPickRecord>>;

/** Quem é da Máfia; vazio para quem não é (a regra do RTDB nega a leitura). */
export function useMafiaTeam(gameId: string, enabled: boolean) {
  const [team, setTeam] = useState<Record<string, MafiaTeamMemberRecord>>({});

  useEffect(() => {
    if (!enabled) return;
    return observeMafiaTeam(gameId, {
      onData: (value) => setTeam(value ?? {}),
      onError: () => setTeam({}),
    });
  }, [enabled, gameId]);

  return enabled ? team : {};
}

function sendMafiaReaction(gameId: string, nightId: string, uid: string, key: string): Promise<void> {
  return applyAtomicUpdate({
    [firebasePaths.gameMafiaReaction(gameId, nightId, crypto.randomUUID())]: { uid, key, at: Date.now() },
  });
}

function actionVerb(roleId: string, actionId: string): string {
  if (actionId === MAFIA_KILL_ACTION_ID) return "vota para matar";
  const role = getRoleById(roleId);
  const action = role?.actionDefinitions?.find(({ id }) => id === actionId) ?? role?.action;
  return action?.verb ?? actionId;
}

interface MafiaTeamPanelProps {
  gameId: string;
  viewerUid: string;
  viewerAlive: boolean;
  /** Noite em andamento; sem ela o painel mostra só quem é da Máfia. */
  nightId: string | null | undefined;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  team: Readonly<Record<string, MafiaTeamMemberRecord>>;
}

/**
 * A Máfia acorda junta: vê os parceiros e as roles deles, o que cada um está escolhendo
 * (com cadeado quando confirmado), o placar do ataque e as reações rápidas do grupo.
 */
export function MafiaTeamPanel({ gameId, viewerUid, viewerAlive, nightId, players, team }: MafiaTeamPanelProps) {
  const [board, setBoard] = useState<Board>({});
  const [reactions, setReactions] = useState<Record<string, MafiaReactionRecord>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!nightId) return;
    const stopBoard = observeMafiaBoard(gameId, nightId, {
      onData: (value) => setBoard(value ?? {}),
      onError: () => setBoard({}),
    });
    const stopReactions = observeMafiaReactions(gameId, nightId, {
      onData: (value) => setReactions(value ?? {}),
      onError: () => setReactions({}),
    });
    return () => {
      stopBoard();
      stopReactions();
    };
  }, [gameId, nightId]);

  const members = Object.entries(team).sort(([left], [right]) =>
    (players[left]?.name ?? "").localeCompare(players[right]?.name ?? "", "pt-BR"),
  );
  const nameOf = (uid: string) => players[uid]?.name ?? "?";
  const liveBoard = nightId ? board : {};
  const tally = tallyMafiaKill(liveBoard, team);
  const recentReactions = nightId
    ? Object.values(reactions).sort((left, right) => right.at - left.at).slice(0, VISIBLE_REACTIONS)
    : [];

  const react = (key: string) => {
    if (!nightId || sending) return;
    setSending(true);
    sendMafiaReaction(gameId, nightId, viewerUid, key)
      .catch(() => undefined)
      .finally(() => setSending(false));
  };

  return (
    <section aria-label="Sua Máfia" className="mt-4 rounded-2xl border border-[#a33843]/35 bg-[#a33843]/10 p-4 text-left">
      <h2 className="font-serif text-lg font-semibold text-[#fffaf0]">Sua Máfia</h2>

      <ul className="mt-3 grid gap-2">
        {members.map(([uid, member]) => {
          const picks = Object.entries(liveBoard[uid] ?? {}).filter(([, pick]) => (pick.targetUids?.length ?? 0) > 0);
          const alive = players[uid]?.alive ?? false;
          return (
            <li key={uid} data-mafia-member={uid} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-[#e5ded2] ${alive ? "" : "line-through opacity-60"}`}>{nameOf(uid)}</span>
                {uid === viewerUid && <span className="text-xs text-[#d3b88c]">você</span>}
                <PlayerRoleTag roleId={member.roleId} className="ml-auto" />
              </div>
              {nightId && alive && (
                <ul className="mt-1 grid gap-0.5 text-sm text-[#bdb7ad]">
                  {picks.length === 0 ? (
                    <li className="text-xs text-[#8f8a82]">Ainda não escolheu.</li>
                  ) : picks.map(([actionId, pick]) => (
                    <li key={actionId} data-mafia-pick={actionId} className="flex items-center gap-1.5">
                      {pick.locked && <Lock aria-label="Confirmado" className="size-3.5 text-[#e6cfa9]" />}
                      <span>
                        {actionVerb(member.roleId, actionId)}{" "}
                        <strong className="text-[#fffaf0]">{(pick.targetUids ?? []).map(nameOf).join(", ")}</strong>
                        {!pick.locked && <span className="text-xs text-[#8f8a82]"> · escolhendo</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {nightId && Object.keys(tally.votesByTarget).length > 0 && (
        <div aria-label="Placar do ataque" className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <p className="text-xs font-bold tracking-[0.12em] text-[#f0b9bd] uppercase">Ataque da Máfia</p>
          <ul className="mt-1 grid gap-0.5 text-[#e5ded2]">
            {Object.entries(tally.votesByTarget)
              .sort(([, left], [, right]) => right.length - left.length)
              .map(([targetUid, votes]) => (
                <li key={targetUid}>
                  <strong>{nameOf(targetUid)}</strong>: {votes.length} {votes.length === 1 ? "voto" : "votos"}{" "}
                  <span className="text-xs text-[#8f8a82]">
                    ({votes.map(({ uid, locked }) => `${nameOf(uid)}${locked ? " 🔒" : ""}`).join(", ")})
                  </span>
                </li>
              ))}
          </ul>
          <p className="mt-1 text-xs text-[#bdb7ad]">
            {tally.projectedTargetUid
              ? `Se a noite acabar agora, ${nameOf(tally.projectedTargetUid)} é atacado.`
              : tally.tied
                ? "Empate sem desempate do Godfather: um dos alvos empatados será sorteado."
                : "Só votos confirmados contam."}
          </p>
        </div>
      )}

      {nightId && (
        <div className="mt-3">
          {viewerAlive && (
            <div aria-label="Reações" className="flex flex-wrap gap-1.5">
              {MAFIA_REACTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  disabled={sending}
                  onClick={() => react(key)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-[#e5ded2] disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {recentReactions.length > 0 && (
            <ul aria-label="Reações recentes" className="mt-2 grid gap-0.5 text-sm text-[#e5ded2]">
              {recentReactions.map((reaction) => (
                <li key={`${reaction.uid}:${reaction.at}`}>
                  <strong>{nameOf(reaction.uid)}</strong>: {REACTION_LABELS[reaction.key] ?? reaction.key}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
