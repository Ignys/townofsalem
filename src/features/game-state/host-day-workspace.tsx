"use client";

import { useMemo } from "react";

import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { Player } from "@/types";

import { HostDayResolutionPanel } from "./host-day-resolution-panel";

export interface HostDayWorkspaceProps {
  gameId: string;
  hostUid: string;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

export function HostDayWorkspace({ gameId, hostUid, players: playerRecords }: HostDayWorkspaceProps) {
  const privateRoles = useHostRoleAssignments(gameId, hostUid);
  const players = useMemo<Player[]>(() => Object.entries(playerRecords).map(([uid, player]) => ({
    id: uid,
    uid,
    ...player,
    statuses: Object.values(privateRoles.assignments[uid]?.statuses ?? {}),
    originalRoleId: privateRoles.assignments[uid]?.originalRoleId,
  })), [playerRecords, privateRoles.assignments]);
  const assignments = useMemo(
    () => Object.fromEntries(
      Object.entries(privateRoles.assignments).map(([uid, assignment]) => [uid, assignment.roleId]),
    ),
    [privateRoles.assignments],
  );

  if (!privateRoles.loaded) {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#1a1c1e] p-6">
        <p role="status">Carregando condução do dia…</p>
      </section>
    );
  }

  if (privateRoles.error) {
    return (
      <section className="rounded-3xl border border-[#a33843]/35 bg-[#a33843]/10 p-6">
        <p role="alert">Não foi possível carregar os dados privados do dia.</p>
      </section>
    );
  }

  return (
    <section id="host-day-workspace" className="scroll-mt-4">
      <HostDayResolutionPanel
        gameId={gameId}
        players={players}
        assignments={assignments}
        privatePlayers={privateRoles.assignments}
      />
    </section>
  );
}
