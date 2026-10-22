"use client";

import { createId } from "@/lib/utils/create-id";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GiCoffin, GiFangs } from "react-icons/gi";
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
import type { MafiaBoardPickRecord, MafiaReactionRecord, MafiaTeamMemberRecord, NightTeam } from "@/types";

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
const HOLD_MS = 450;

export type MafiaBoard = Record<string, Record<string, MafiaBoardPickRecord>>;

export const VAMPIRE_BITE_ACTION_ID = "vampire-bite-vote";

/** O que muda entre o painel da Máfia e o dos Vampiros. */
const TEAM_PANEL = {
  mafia: {
    title: "Sua Máfia",
    killActionId: MAFIA_KILL_ACTION_ID,
    killLabel: "Ataque",
    Icon: PiKnife,
    sectionClass: "border-[#5e4547]/60 bg-[#1e1919]",
    iconClass: "bg-[#b06a6a]/12 text-[#dcbcbc]",
    accentText: "text-[#d6c8c6]",
    killPick: "bg-[#b06a6a]/15",
    killText: "text-[#e2acac]",
    ownBubble: "bg-[#58393b]",
    mentionPill: "border-[#b06a6a]/25 bg-[#58393b]/25 hover:bg-[#58393b]/45",
    targetCard: "border-[#b06a6a]",
  },
  vampire: {
    title: "Seus Vampiros",
    killActionId: VAMPIRE_BITE_ACTION_ID,
    killLabel: "Mordida",
    Icon: GiFangs,
    sectionClass: "border-[#6f7d5c]/60 bg-[#181d15]",
    iconClass: "bg-[#9aab84]/15 text-[#c9d6b8]",
    accentText: "text-[#c9d6b8]",
    killPick: "bg-[#9aab84]/18",
    killText: "text-[#c9d6b8]",
    ownBubble: "bg-[#4c5a3c]",
    mentionPill: "border-[#9aab84]/30 bg-[#4c5a3c]/25 hover:bg-[#4c5a3c]/45",
    targetCard: "border-[#9aab84]",
  },
} as const;

/** Ação que vira o voto do grupo (ataque da Máfia ou mordida dos Vampiros). */
export function teamKillActionId(team: NightTeam): string {
  return TEAM_PANEL[team].killActionId;
}

/** Quem é da Máfia; vazio para quem não é (a regra do RTDB nega a leitura). */
export function useMafiaTeam(gameId: string, nightTeam: NightTeam | null) {
  const [team, setTeam] = useState<Record<string, MafiaTeamMemberRecord>>({});

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!nightTeam) return;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = observeMafiaTeam(gameId, {
      onData: (value) => setTeam(value ?? {}),
      // O mestre pode publicar o time depois desta tela abrir: até lá a regra nega a leitura
      // e o listener morre. Tenta de novo em vez de ficar sem time até o F5.
      onError: () => {
        setTeam({});
        retry = setTimeout(() => setAttempt((count) => count + 1), 3000);
      },
    }, nightTeam);
    return () => {
      clearTimeout(retry);
      unsubscribe();
    };
  }, [nightTeam, gameId, attempt]);

  return nightTeam ? team : {};
}

/** As escolhas ao vivo da Máfia nesta noite (vazio fora da noite ou para quem não é da Máfia). */
export function useMafiaBoard(gameId: string, nightId: string | null | undefined, nightTeam: NightTeam = "mafia") {
  const [board, setBoard] = useState<{ nightId: string; value: MafiaBoard } | null>(null);

  useEffect(() => {
    if (!nightId) return;
    return observeMafiaBoard(gameId, nightId, {
      onData: (value) => setBoard({ nightId, value: value ?? {} }),
      onError: () => setBoard({ nightId, value: {} }),
    }, nightTeam);
  }, [gameId, nightId, nightTeam]);

  return nightId && board?.nightId === nightId ? board.value : {};
}

function sendMafiaReaction(
  gameId: string,
  nightId: string,
  uid: string,
  key: string,
  targetUid: string | null,
  nightTeam: NightTeam,
): Promise<void> {
  return applyAtomicUpdate({
    [firebasePaths.gameMafiaReaction(gameId, nightId, createId(), nightTeam)]: {
      uid,
      key,
      at: Date.now(),
      ...(targetUid ? { targetUid } : {}),
    },
  });
}

function actionVerb(roleId: string, actionId: string, nightTeam: NightTeam): string {
  if (actionId === TEAM_PANEL[nightTeam].killActionId) return TEAM_PANEL[nightTeam].killLabel;
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
  nightTeam?: NightTeam;
  /** Vampiros na noite de descanso depois de uma conversão: não há mordida. */
  resting?: boolean;
}

/**
 * A Máfia acorda junta: o alvo que o grupo está levando, o que cada parceiro escolheu e as
 * reações rápidas. Os alvos em si são escolhidos na lista de jogadores.
 */
export function MafiaTeamPanel({ gameId, viewerUid, viewerAlive, nightId, players, team, board, nightTeam = "mafia", resting = false }: MafiaTeamPanelProps) {
  const look = TEAM_PANEL[nightTeam];
  const [reactions, setReactions] = useState<Record<string, MafiaReactionRecord>>({});
  const [sending, setSending] = useState(false);
  // Reação escolhida, esperando o segundo toque: sobre quem ela é.
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  // Toque envia; segurar abre a menção. O clique que encerra o toque longo é ignorado.
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const stopHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  useEffect(() => {
    if (!nightId) return;
    return observeMafiaReactions(gameId, nightId, {
      onData: (value) => setReactions(value ?? {}),
      onError: () => setReactions({}),
    }, nightTeam);
  }, [gameId, nightId, nightTeam]);

  const members = Object.entries(team).sort(([left], [right]) =>
    (players[left]?.name ?? "").localeCompare(players[right]?.name ?? "", "pt-BR"),
  );
  const nameOf = (uid: string) => players[uid]?.name ?? "?";
  const tally = tallyMafiaKill(board, team, look.killActionId);
  // No empate o cartão mostra todos os que lideram; o sorteio fica entre eles.
  const projectedVotes = Math.max(0, ...Object.values(tally.votesByTarget).map((votes) => votes.length));
  const leadingUids = tally.projectedTargetUid
    ? [tally.projectedTargetUid]
    : tally.tied
      ? Object.keys(tally.votesByTarget).filter((uid) => tally.votesByTarget[uid].length === projectedVotes)
      : [];
  const leadingNames = leadingUids.map(nameOf).join(" ou ");
  const recentReactions = nightId
    ? Object.values(reactions).sort((left, right) => right.at - left.at).slice(0, VISIBLE_REACTIONS)
    : [];

  const react = (key: string, targetUid: string | null) => {
    if (!nightId || sending) return;
    setSending(true);
    setPendingKey(null);
    sendMafiaReaction(gameId, nightId, viewerUid, key, targetUid, nightTeam)
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
    <section aria-label={look.title} className={`panel-private mt-4 ${look.sectionClass} text-left`}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${look.iconClass}`}
        >
          <look.Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-lg font-semibold text-[#fffaf0]">{look.title}</h2>
          {nightId && (
            <p className={`text-sm ${look.accentText}`}>
              {resting
                ? "Sem mordida nesta noite."
                : tally.projectedTargetUid
                ? "O grupo escolheu o alvo desta noite."
                : tally.tied
                  ? "Empate: um dos alvos empatados será sorteado."
                  : "Ninguém votou ainda. Escolha o alvo na lista."}
            </p>
          )}
        </div>
      </div>

      {nightId && !resting && leadingUids.length > 0 && (
        // O alvo marcado: o nome em destaque e uma lâmina por membro vivo, acesa para quem votou nele.
        <div
          role="status"
          aria-label={`${look.killLabel} em ${leadingNames}, ${projectedVotes} de ${members.filter(([uid]) => players[uid]?.alive).length} votos`}
          className={`mt-3 flex items-center gap-3 rounded-lg border-l-4 ${look.targetCard} bg-black/30 py-1.5 pr-3 pl-3`}
        >
          <p className="min-w-0 flex-1 truncate font-serif text-lg font-semibold text-[#fffaf0]">
            {leadingNames}
          </p>
          <span className="flex shrink-0 gap-0.5" aria-hidden="true">
            {members.filter(([uid]) => players[uid]?.alive).map(([uid], index) => (
              <look.Icon
                key={uid}
                className={`size-4 ${index < projectedVotes ? look.killText : "text-white/15"}`}
              />
            ))}
          </span>
        </div>
      )}

      {nightId && resting && (
        // A noite de descanso substitui a votação: fica claro que não há o que escolher.
        <div
          role="status"
          className="mt-3 flex items-start gap-3 rounded-xl border border-dashed border-[#9aab84]/45 bg-black/30 px-3.5 py-3"
        >
          <GiCoffin aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-[#9aab84]" />
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold text-[#e4ecd8]">Noite de descanso</p>
            <p className="mt-0.5 text-sm leading-6 text-[#b9c6a8]">
              Vocês converteram alguém na noite passada. Hoje ninguém morde; a mordida volta na próxima noite.
            </p>
          </div>
        </div>
      )}

      <ul className="mt-3 divide-y divide-white/8">
        {members.map(([uid, member]) => {
          const picks = Object.entries(board[uid] ?? {}).filter(([, pick]) => (pick.targetUids?.length ?? 0) > 0);
          const alive = players[uid]?.alive ?? false;
          return (
            <li key={uid} data-mafia-member={uid} className="flex min-h-10 flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-sm">
              <span className={`min-w-0 truncate font-semibold ${alive ? "text-[#f3ead9]" : "text-[#8f8a82] line-through"}`}>
                {nameOf(uid)}
              </span>
              <RoleTag roleId={member.roleId} />
              {nightId && alive && (
                // Cada escolha vira uma etiqueta: a ação em tom apagado, o alvo em destaque.
                <span className="ml-auto flex flex-wrap justify-end gap-1">
                  {picks.length === 0 ? (
                    <span className="text-xs text-[#8f8a82] italic">{resting ? "descansando" : "pensando…"}</span>
                  ) : (
                    picks.map(([actionId, pick]) => (
                      <span
                        key={actionId}
                        className={`inline-flex max-w-full items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2 text-xs ${
                          actionId === look.killActionId ? look.killPick : "bg-white/7"
                        }`}
                      >
                        <span className={actionId === look.killActionId ? look.killText : "text-[#bdb7ad]"}>
                          {actionVerb(member.roleId, actionId, nightTeam)}
                        </span>
                        <span className="truncate font-semibold text-[#fffaf0]">
                          {(pick.targetUids ?? []).map(nameOf).join(", ")}
                        </span>
                      </span>
                    ))
                  )}
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
                      ? `ml-auto ${look.ownBubble} text-white`
                      : "bg-white/8 text-[#e5ded2]"
                  }`}
                >
                  {reaction.uid !== viewerUid && <strong className="mr-1 font-semibold">{nameOf(reaction.uid)}:</strong>}
                  {REACTION_LABELS[reaction.key] ?? reaction.key}
                  {reaction.targetUid && (
                    <span className="ml-1.5 inline-flex rounded-full bg-black/30 px-2 py-0.5 align-middle text-xs font-semibold text-[#fffaf0] ring-1 ring-white/15">
                      @{nameOf(reaction.targetUid)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {viewerAlive && pendingKey && (
            <div aria-label="Sobre quem" className="rounded-xl bg-black/25 p-2">
              <div className={`mb-1.5 flex items-center gap-2 px-1 text-xs ${look.accentText}`}>
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
                    className={`${pillClass} ${look.mentionPill} text-[#f3ead9]`}
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
                  onPointerDown={() => {
                    held.current = false;
                    holdTimer.current = setTimeout(() => {
                      held.current = true;
                      setPendingKey(key);
                    }, HOLD_MS);
                  }}
                  onPointerUp={stopHold}
                  onPointerLeave={stopHold}
                  onContextMenu={(event) => event.preventDefault()}
                  onClick={() => {
                    if (held.current) {
                      held.current = false;
                      return;
                    }
                    stopHold();
                    react(key, null);
                  }}
                  className={`${pillClass} touch-manipulation select-none [-webkit-touch-callout:none] border-white/15 bg-white/5 text-[#e5ded2] hover:bg-white/10`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {viewerAlive && !pendingKey && (
            <p className="mt-2 text-xs text-[#8f8a82]">
              Toque para enviar. Segure para marcar alguém.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
