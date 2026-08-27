"use client";

import { useMemo } from "react";

import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { Player } from "@/types";

import { NightResolutionPreview } from "./night-resolution-preview";
import { useHostNightLog } from "./use-host-night-log";

export interface HostNightWorkspaceProps {
  gameId: string;
  nightId: string;
  nightNumber: number;
  hostUid: string;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

export function HostNightWorkspace({ gameId, nightId, nightNumber, hostUid, players: playerRecords }: HostNightWorkspaceProps) {
  const privateRoles = useHostRoleAssignments(gameId, hostUid);
  const nightLog = useHostNightLog(gameId, nightId, hostUid);
  const players = useMemo<Player[]>(() => Object.entries(playerRecords).map(([uid, player]) => ({
    id: uid,
    uid,
    ...player,
    statuses: Object.values(privateRoles.assignments[uid]?.statuses ?? {}),
    originalRoleId: privateRoles.assignments[uid]?.originalRoleId,
  })), [playerRecords, privateRoles.assignments]);
  const assignments = useMemo(() => Object.fromEntries(Object.entries(privateRoles.assignments).map(([uid, assignment]) => [uid, assignment.roleId])), [privateRoles.assignments]);
  const entries = Object.values(nightLog.actions);
  const allActionEntries = Object.values(nightLog.allActions).flatMap((actions) =>
    Object.values(actions),
  );

  if (!privateRoles.loaded || !nightLog.loaded) {
    return <section className="rounded-3xl border border-white/10 bg-[#1a1c1e] p-6"><p role="status">Carregando condução da noite…</p></section>;
  }

  if (privateRoles.error || nightLog.error) {
    return <section className="rounded-3xl border border-[#a33843]/35 bg-[#a33843]/10 p-6"><p role="alert">Não foi possível carregar os dados privados da noite.</p></section>;
  }

  return (
    <section id="host-night-workspace" className="scroll-mt-4">
      {nightLog.session && (
        <NightResolutionPreview
          gameId={gameId}
          nightId={nightId}
          nightNumber={nightNumber}
          session={nightLog.session}
          players={players}
          assignments={assignments}
          privatePlayers={privateRoles.assignments}
          entries={entries}
          actionHistory={allActionEntries}
        />
      )}
    </section>
  );
}
