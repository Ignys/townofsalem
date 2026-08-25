"use client";

import { useMemo, useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { HostNightActionEntry, Player } from "@/types";

import { HostActionComposer } from "./host-action-composer";
import { HostActionLog } from "./host-action-log";
import { setWakeChecklistStatus } from "./host-night-action-repository";
import { HostNightNotes } from "./host-night-notes";
import { generateNightWakePlan, type NightWakeItem } from "./night-wake-plan";
import { NightWakeChecklist } from "./night-wake-checklist";
import { NightResolutionPreview } from "./night-resolution-preview";
import { deputyHasSheriffAbility } from "@/game-engine/role-rules";
import { useHostNightLog } from "./use-host-night-log";

interface HostNightWorkspaceProps {
  gameId: string;
  nightId: string;
  nightNumber: number;
  hostUid: string;
  players: Readonly<Record<string, PublicPlayerRecord>>;
  externalSelectedActorUid?: string | null;
}

export function HostNightWorkspace({ gameId, nightId, nightNumber, hostUid, players: playerRecords, externalSelectedActorUid }: HostNightWorkspaceProps) {
  const privateRoles = useHostRoleAssignments(gameId, hostUid);
  const nightLog = useHostNightLog(gameId, nightId, hostUid);
  const [selectedWakeItem, setSelectedWakeItem] = useState<NightWakeItem | null>(null);
  const [editingEntry, setEditingEntry] = useState<HostNightActionEntry | null>(null);
  const players = useMemo<Player[]>(() => Object.entries(playerRecords).map(([uid, player]) => ({ id: uid, uid, ...player })), [playerRecords]);
  const assignments = useMemo(() => Object.fromEntries(Object.entries(privateRoles.assignments).map(([uid, assignment]) => [uid, assignment.roleId])), [privateRoles.assignments]);
  const wakePlan = useMemo(() => {
    const playersWithRoles = players.map((player) => ({
      ...player,
      roleId: assignments[player.uid],
    }));
    const deputyActive = deputyHasSheriffAbility(playersWithRoles);

    return generateNightWakePlan(
      players,
      Object.entries(assignments).map(([playerUid, roleId]) => ({
        playerUid,
        roleId,
      })),
      ROLE_DEFINITIONS,
      {
        nightNumber,
        includePlayer: (_player, role) => role.id !== "deputy" || deputyActive,
      },
    );
  }, [assignments, nightNumber, players]);
  const entries = Object.values(nightLog.actions);
  const allActionEntries = Object.values(nightLog.allActions).flatMap((actions) =>
    Object.values(actions),
  );
  const notes = Object.values(nightLog.notes);
  const locked = Boolean(nightLog.session?.resolutionAppliedAt && !nightLog.session.rolledBackAt);
  const context = { players, assignments, roleDefinitions: ROLE_DEFINITIONS };

  if (!privateRoles.loaded || !nightLog.loaded) {
    return <section className="rounded-3xl border border-white/10 bg-[#1a1c1e] p-6"><p role="status">Carregando condução da noite…</p></section>;
  }

  if (privateRoles.error || nightLog.error) {
    return <section className="rounded-3xl border border-[#a33843]/35 bg-[#a33843]/10 p-6"><p role="alert">Não foi possível carregar os dados privados da noite.</p></section>;
  }

  return (
    <section id="host-night-workspace" className="scroll-mt-4 rounded-3xl border border-white/10 bg-[#1a1c1e] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">Condução presencial</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">Noite {nightNumber}</h2>
        </div>
        {locked && <span className="rounded-full border border-[#6f9b77]/35 px-3 py-1 text-xs font-bold text-[#bfe0c5]">Resolução aplicada · log bloqueado</span>}
      </header>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <NightWakeChecklist
          items={wakePlan}
          states={nightLog.session?.wakeChecklist ?? {}}
          disabled={locked}
          onSelect={(item) => { setSelectedWakeItem(item); setEditingEntry(null); }}
          onStatusChange={(itemId, status) => void setWakeChecklistStatus(gameId, nightId, itemId, status)}
        />
        {!locked && (
          <HostActionComposer
            key={editingEntry?.id ?? selectedWakeItem?.id ?? externalSelectedActorUid ?? "new-action"}
            gameId={gameId}
            nightId={nightId}
            nightNumber={nightNumber}
            players={players}
            assignments={assignments}
            selectedActorUid={selectedWakeItem?.members[0]?.playerUid ?? externalSelectedActorUid ?? undefined}
            wakeItemId={selectedWakeItem?.members.length === 1 ? selectedWakeItem.id : undefined}
            editingEntry={editingEntry}
            actionEntries={allActionEntries}
            onSaved={() => setEditingEntry(null)}
          />
        )}
        <HostActionLog gameId={gameId} entries={entries} context={context} locked={locked} onEdit={(entry) => { setEditingEntry(entry); setSelectedWakeItem(null); }} />
        <HostNightNotes gameId={gameId} nightId={nightId} notes={notes} locked={locked} />
      </div>
      {nightLog.session && (
        <NightResolutionPreview
          gameId={gameId}
          nightId={nightId}
          nightNumber={nightNumber}
          session={nightLog.session}
          players={players}
          assignments={assignments}
          entries={entries}
          actionHistory={allActionEntries}
        />
      )}
    </section>
  );
}
