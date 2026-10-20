"use client";

import { createId } from "@/lib/utils/create-id";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { PiKnife } from "react-icons/pi";

import { getRoleById } from "@/data/roles";
import { RoleTag } from "@/features/game-state/player-status-board";
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
const VISIBLE_REACTIONS = 4;

export type MafiaBoard = Record<string, Record<string, MafiaBoardPickRecord>>;

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

/** As escolhas ao vivo da Máfia nesta noite (vazio fora da noite ou para quem não é da Máfia). */
export function useMafiaBoard(gameId: string, nightId: string | null | undefined) {
  const [board, setBoard] = useState<{ nightId: string; value: MafiaBoard } | null>(null);

  useEffect(() => {
    if (!nightId) return;
    return observeMafiaBoard(gameId, nightId, {
      onData: (value) => setBoard({ nightId, value: value ?? {} }),
      onError: () => setBoard({ nightId, value: {} }),
    });
  }, [gameId, nightId]);

  return nightId && board?.nightId === nightId ? board.value : {};
}

function sendMafiaReaction(
  gameId: string,
  nightId: string,
  uid: string,
  key: string,
  targetUid: string | null,
): Promise<void> {
  return applyAtomicUpdate({
    [firebasePaths.gameMafiaReaction(gameId, nightId, createId())]: {
      uid,
      key,
      at: Date.now(),
      ...(targetUid ? { targetUid } : {}),
    },
  });
}

function actionVerb(roleId: string, actionId: string): string {
  if (actionId === MAFIA_KILL_ACTION_ID) return "ataque";
  const role = getRoleById(roleId);
  const action = role?.actionDefinitions?.find(({ id }) => id === actionId) ?? role?.action;
  return action?.label ?? actionId;
}

interface MafiaTeamPanelProps {
  gameId: string;
  viewerUid: string;
  viewerAlive: boolean;
  /** Noite em andamento; sem ela o painel mostra só quem é da Máfia. */
  nightId: string | null | undefined;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  team: Readonly<Record<string, MafiaTeamMemberRecord>>;
  board: MafiaBoard;
}

/**
 * A Máfia acorda junta: o alvo que o grupo está levando, o que cada parceiro escolheu e as
 * reações rápidas. Os alvos em si são escolhidos na lista de jogadores.
 */
export function MafiaTeamPanel({ gameId, viewerUid, viewerAlive, nightId, players, team, board }: MafiaTeamPanelProps) {
  const [reactions, setReactions] = useState<Record<string, MafiaReactionRecord>>({});
  const [sending, setSending] = useState(false);
  // Reação escolhida, esperando o segundo toque: sobre quem ela é.
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!nightId) return;
    return observeMafiaReactions(gameId, nightId, {
      onData: (value) => setReactions(value ?? {}),
      onError: () => setReactions({}),
    });
  }, [gameId, nightId]);

  const members = Object.entries(team).sort(([left], [right]) =>
    (players[left]?.name ?? "").localeCompare(players[right]?.name ?? "", "pt-BR"),
  );
  const nameOf = (uid: string) => players[uid]?.name ?? "?";
  const tally = tallyMafiaKill(board, team);
  const projectedVotes = tally.projectedTargetUid ? tally.votesByTarget[tally.projectedTargetUid]?.length ?? 0 : 0;
  const recentReactions = nightId
    ? Object.values(reactions).sort((left, right) => right.at - left.at).slice(0, VISIBLE_REACTIONS)
    : [];

  const react = (key: string, targetUid: string | null) => {
    if (!nightId || sending) return;
    setSending(true);
    setPendingKey(null);
    sendMafiaReaction(gameId, nightId, viewerUid, key, targetUid)
      .catch(() => undefined)
      .finally(() => setSending(false));
  };
  // Quem já leva votos de ataque vem primeiro: costuma ser de quem o grupo está falando.
  const mentionable = Object.entries(players)
    .filter(([uid, player]) => player.alive && uid !== viewerUid)
    .sort(
      ([leftUid, left], [rightUid, right]) =>
        (tally.votesByTarget[rightUid]?.length ?? 0) - (tally.votesByTarget[leftUid]?.length ?? 0)
        || left.name.localeCompare(right.name, "pt-BR"),
    );
  const pillClass =
    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-[#d3b88c] disabled:opacity-50";

  return (
    <section aria-label="Sua Máfia" className="panel-private mt-4 border-[#a33843]/60 bg-[#2a1517] text-left">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#db4242]/15 text-[#f0b9bd]"
        >
          <PiKnife className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-lg font-semibold text-[#fffaf0]">Sua Máfia</h2>
          {nightId && (
            <p className="text-sm text-[#e6c3c6]">
              {tally.projectedTargetUid
                ? `Alvo: ${nameOf(tally.projectedTargetUid)} (${projectedVotes} ${projectedVotes === 1 ? "voto" : "votos"})`
                : tally.tied
                  ? "Empate: um dos alvos empatados será sorteado."
                  : "Ninguém votou ainda. Escolha o alvo na lista."}
            </p>
          )}
        </div>
      </div>

      <ul className="mt-3 divide-y divide-white/8">
        {members.map(([uid, member]) => {
          const picks = Object.entries(board[uid] ?? {}).filter(([, pick]) => (pick.targetUids?.length ?? 0) > 0);
          const alive = players[uid]?.alive ?? false;
          return (
            <li key={uid} data-mafia-member={uid} className="flex min-h-10 items-center gap-2 py-1.5 text-sm">
              <span className={`min-w-0 truncate font-semibold ${alive ? "text-[#f3ead9]" : "text-[#8f8a82] line-through"}`}>
                {nameOf(uid)}
              </span>
              <RoleTag roleId={member.roleId} />
              {nightId && alive && (
                <span className="ml-auto truncate text-right text-xs text-[#bdb7ad]">
                  {picks.length === 0
                    ? "pensando…"
                    : picks
                        .map(([actionId, pick]) => `${actionVerb(member.roleId, actionId)} → ${(pick.targetUids ?? []).map(nameOf).join(", ")}`)
                        .join(" · ")}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {nightId && (
        <div className="mt-3 border-t border-white/8 pt-3">
          {recentReactions.length > 0 && (
            <ul aria-label="Reações recentes" className="mb-2 grid gap-1">
              {[...recentReactions].reverse().map((reaction) => (
                <li
                  key={`${reaction.uid}:${reaction.at}`}
                  className={`w-fit max-w-full rounded-2xl px-3 py-1 text-sm ${
                    reaction.uid === viewerUid
                      ? "ml-auto bg-[#7d2330] text-white"
                      : "bg-white/8 text-[#e5ded2]"
                  }`}
                >
                  {reaction.uid !== viewerUid && <strong className="mr-1 font-semibold">{nameOf(reaction.uid)}:</strong>}
                  {REACTION_LABELS[reaction.key] ?? reaction.key}
                  {reaction.targetUid && (
                    <strong className="ml-1 font-semibold">→ {nameOf(reaction.targetUid)}</strong>
                  )}
                </li>
              ))}
            </ul>
          )}
          {viewerAlive && pendingKey && (
            <div aria-label="Sobre quem" className="rounded-xl bg-black/25 p-2">
              <div className="mb-1.5 flex items-center gap-2 px-1 text-xs text-[#e6c3c6]">
                <span className="min-w-0 flex-1 truncate">
                  <strong className="text-[#fffaf0]">{REACTION_LABELS[pendingKey]}</strong> sobre quem?
                </span>
                <button
                  type="button"
                  aria-label="Cancelar"
                  onClick={() => setPendingKey(null)}
                  className="rounded-full p-1 text-[#bdb7ad] hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-[#d3b88c]"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => react(pendingKey, null)}
                  className={`${pillClass} border-white/25 bg-white/10 text-[#fffaf0] hover:bg-white/15`}
                >
                  Ninguém
                </button>
                {mentionable.map(([uid, player]) => (
                  <button
                    key={uid}
                    type="button"
                    disabled={sending}
                    onClick={() => react(pendingKey, uid)}
                    className={`${pillClass} border-[#db4242]/30 bg-[#7d2330]/25 text-[#f3ead9] hover:bg-[#7d2330]/45`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {viewerAlive && !pendingKey && (
            <div aria-label="Reações" className="flex flex-wrap gap-1.5">
              {MAFIA_REACTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  disabled={sending}
                  onClick={() => setPendingKey(key)}
                  className={`${pillClass} border-white/15 bg-white/5 text-[#e5ded2] hover:bg-white/10`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
