"use client";

import { useMemo } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { createEngineGameState } from "@/game-engine/host-action-adapter";
import { checkWinCondition } from "@/game-engine/win-condition";
import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { Player } from "@/types";

interface HostWinConditionSuggestionProps {
  gameId: string;
  hostUid: string;
  nightId?: string | null;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

export function HostWinConditionSuggestion({ gameId, hostUid, nightId, players: records }: HostWinConditionSuggestionProps) {
  const privateRoles = useHostRoleAssignments(gameId, hostUid);
  const players = useMemo<Player[]>(() => Object.entries(records).map(([uid, player]) => ({ id: uid, uid, ...player })), [records]);
  const assignments = useMemo(() => Object.fromEntries(Object.entries(privateRoles.assignments).map(([uid, role]) => [uid, role.roleId])), [privateRoles.assignments]);
  const result = checkWinCondition(createEngineGameState({ gameId, nightId: nightId ?? "administrative-check", players, assignments, roleDefinitions: ROLE_DEFINITIONS }));

  return (
    <section className={`rounded-2xl border p-4 text-sm ${result.gameOver ? "border-[#d3b88c]/40 bg-[#d3b88c]/10" : "border-white/10 bg-black/15"}`}>
      <h3 className="font-semibold">Assistência de condição de vitória</h3>
      {result.gameOver ? <p className="mt-2 text-[#e6cfa9]">Possível condição de vitória atingida. O mestre deve confirmar o encerramento.</p> : <p className="mt-2 text-[#9f9990]">{result.confidenceOrWarnings[0] ?? "Nenhuma condição confirmada foi atingida."}</p>}
    </section>
  );
}
