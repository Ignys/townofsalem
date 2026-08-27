"use client";

import { useMemo } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { formatHostActionEntry } from "@/features/night-actions/host-action-entry";
import { presentNightResolution } from "@/features/night-actions/night-resolution-presentation";
import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { Player } from "@/types";

import { useHostHistory } from "./use-host-history";

interface HostHistoryPanelProps {
  gameId: string;
  hostUid: string;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

export function HostHistoryPanel({ gameId, hostUid, players: playerRecords }: HostHistoryPanelProps) {
  const history = useHostHistory(gameId, hostUid);
  const roles = useHostRoleAssignments(gameId, hostUid);
  const players = useMemo<Player[]>(() => Object.entries(playerRecords).map(([uid, player]) => ({ id: uid, uid, ...player })), [playerRecords]);
  const assignments = useMemo(() => Object.fromEntries(Object.entries(roles.assignments).map(([uid, value]) => [uid, value.roleId])), [roles.assignments]);
  const names = Object.fromEntries(players.map(({ uid, name }) => [uid, name]));
  const sessions = Object.values(history.sessions).sort((a, b) => b.nightNumber - a.nightNumber);
  const events = Object.entries(history.events).sort(([, a], [, b]) => b.timestamp - a.timestamp).slice(0, 30);

  const exportHistory = () => {
    const payload = JSON.stringify({ gameId, nightSessions: history.sessions, actionLog: history.actions, nightResolutions: history.resolutions, eventHistory: history.events }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `town-of-salem-${gameId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[#1a1c1e] p-4 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">Auditoria</p><h2 className="mt-2 font-serif text-2xl font-semibold">Histórico da partida</h2></div>
        <button type="button" disabled={!history.loaded} onClick={exportHistory} className="min-h-10 rounded-xl border border-white/15 px-3 text-sm font-bold disabled:opacity-50">Exportar JSON</button>
      </div>
      {history.error ? <p role="alert" className="mt-4 text-sm text-[#f0b9bd]">Histórico indisponível.</p> : (
        <div className="mt-4 grid gap-3">
          {sessions.map((session) => {
            const entries = Object.values(history.actions[session.id] ?? {}).sort((a, b) => a.createdAt - b.createdAt);
            const record = history.resolutions[session.id];
            const presentation = record ? presentNightResolution(record.resolution, names) : null;
            return (
              <details key={session.id} className="rounded-xl border border-white/10 p-3">
                <summary className="cursor-pointer font-semibold">Noite {session.nightNumber}{record?.rolledBackAt ? " · corrigida/rollback" : record?.appliedAt ? " · confirmada" : " · em andamento"}</summary>
                <div className="mt-3 grid gap-3 text-sm">
                  <ol>{entries.map((entry, index) => <li key={entry.id}>{index + 1}. {formatHostActionEntry(entry, { players, assignments, roleDefinitions: ROLE_DEFINITIONS })}</li>)}</ol>
                  {presentation && <ul className="rounded-lg bg-black/20 p-2">{presentation.summary.map((line) => <li key={line}>{line}</li>)}</ul>}
                  {presentation?.warnings.map((line) => <p key={line} className="text-xs text-[#f0b9bd]">{line}</p>)}
                </div>
              </details>
            );
          })}
          <details className="rounded-xl border border-white/10 p-3">
            <summary className="cursor-pointer font-semibold">Event History técnico</summary>
            <ol className="mt-3 grid gap-2 text-xs text-[#bdb7ad]">{events.map(([id, event]) => <li key={id}><time>{new Date(event.timestamp).toLocaleString("pt-BR")}</time> · {event.type}</li>)}</ol>
          </details>
        </div>
      )}
    </section>
  );
}
