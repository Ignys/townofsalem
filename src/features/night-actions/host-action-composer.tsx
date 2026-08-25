"use client";

import { useMemo, useRef, useState } from "react";

import { getRoleById, ROLE_DEFINITIONS } from "@/data/roles";
import type { HostNightActionEntry, Player } from "@/types";
import { currentTimestamp } from "@/lib/utils/timestamp";

import { formatHostActionEntry } from "./host-action-entry";
import { saveHostNightAction } from "./host-night-action-repository";
import { hasBlockingHostActionIssues, validateHostNightAction } from "./validate-host-night-action";

interface HostActionComposerProps {
  gameId: string;
  nightId: string;
  nightNumber: number;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  selectedActorUid?: string;
  wakeItemId?: string;
  editingEntry?: HostNightActionEntry | null;
  actionEntries?: readonly HostNightActionEntry[];
  onSaved: () => void;
}

export function HostActionComposer({ gameId, nightId, nightNumber, players, assignments, selectedActorUid, wakeItemId, editingEntry, actionEntries = [], onSaved }: HostActionComposerProps) {
  const saving = useRef(false);
  const [actorUid, setActorUid] = useState(editingEntry?.actorUid ?? selectedActorUid ?? "");
  const [actionId, setActionId] = useState(editingEntry?.actionId ?? "");
  const [targetUids, setTargetUids] = useState<string[]>(editingEntry ? [...editingEntry.targetUids] : []);
  const [notes, setNotes] = useState(editingEntry?.optionalNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const role = getRoleById(assignments[actorUid] ?? "");
  const actions = useMemo(() => role?.actionDefinitions ?? (role?.action ? [role.action] : []), [role]);
  const selectedActionId = actionId || (actions.length === 1 ? actions[0].id : "");
  const action = actions.find(({ id }) => id === selectedActionId);
  const entry = useMemo<HostNightActionEntry | null>(() => {
    if (!actorUid || !role || !action) return null;
    return {
      id: editingEntry?.id ?? "preview",
      nightId,
      actorUid,
      roleIdSnapshot: role.id,
      actionId: selectedActionId,
      targetUids,
      createdAt: editingEntry?.createdAt ?? 0,
      updatedAt: editingEntry?.updatedAt ?? 0,
      status: "confirmed",
      ...(notes.trim() ? { optionalNotes: notes.trim() } : {}),
    };
  }, [action, actorUid, editingEntry, nightId, notes, role, selectedActionId, targetUids]);
  const context = useMemo(
    () => ({
      players,
      assignments,
      roleDefinitions: ROLE_DEFINITIONS,
      nightId,
      nightNumber,
      actionEntries,
    }),
    [actionEntries, assignments, nightId, nightNumber, players],
  );
  const issues = entry ? validateHostNightAction(entry, context) : [];
  const availableTargets = action
    ? players.filter(
        (player) =>
          (action.allowSelfTarget || player.uid !== actorUid) &&
          (action.allowDeadTarget || player.alive) &&
          (!action.requireDeadTarget || !player.alive),
      )
    : [];
  const availableActors = players.filter(({ uid }) => {
    const assignedRole = getRoleById(assignments[uid] ?? "");
    return Boolean(assignedRole?.actionDefinitions?.length || assignedRole?.action);
  });

  const setTarget = (index: number, uid: string) => {
    setTargetUids((current) => Array.from({ length: action?.targetCount ?? 0 }, (_, targetIndex) => targetIndex === index ? uid : current[targetIndex] ?? ""));
  };

  const handleSubmit = async () => {
    if (!entry || hasBlockingHostActionIssues(issues) || saving.current) return;
    saving.current = true;
    setBusy(true);
    setFeedback("");
    const timestamp = currentTimestamp();
    const savedEntry = {
      ...entry,
      id: editingEntry?.id ?? crypto.randomUUID(),
      createdAt: editingEntry?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    try {
      await saveHostNightAction(gameId, savedEntry, wakeItemId);
      setFeedback("Ação salva no log.");
      if (!editingEntry) setTargetUids([]);
      onSaved();
    } catch {
      setFeedback("Não foi possível salvar a ação.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#d3b88c]/25 bg-[#d3b88c]/[0.06] p-4">
      <h3 className="font-semibold text-[#fffaf0]">Registrar ação</h3>
      <div className="mt-3 grid gap-3">
        <label className="grid gap-1 text-sm font-semibold">Ator
          <select value={actorUid} onChange={(event) => { setActorUid(event.target.value); setActionId(""); setTargetUids([]); }} className="min-h-11 rounded-xl border border-white/15 bg-[#161719] px-3 text-[#fffaf0]">
            <option value="">Selecione jogador — role</option>
            {availableActors.map((player) => <option key={player.uid} value={player.uid}>{player.name} — {getRoleById(assignments[player.uid])?.name}</option>)}
          </select>
        </label>
        {actions.length > 1 && (
          <label className="grid gap-1 text-sm font-semibold">Ação
            <select value={selectedActionId} onChange={(event) => { setActionId(event.target.value); setTargetUids([]); }} className="min-h-11 rounded-xl border border-white/15 bg-[#161719] px-3 text-[#fffaf0]">
              <option value="">Selecione a ação</option>
              {actions.map((definition) => <option key={definition.id} value={definition.id}>{definition.label}</option>)}
            </select>
          </label>
        )}
        {action && Array.from({ length: action.targetCount }, (_, index) => (
          <label key={index} className="grid gap-1 text-sm font-semibold">Alvo {action.targetCount > 1 ? index + 1 : ""}
            <select value={targetUids[index] ?? ""} onChange={(event) => setTarget(index, event.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-[#161719] px-3 text-[#fffaf0]">
              <option value="">Selecione o alvo</option>
              {availableTargets.map((player) => <option key={player.uid} value={player.uid}>{player.name}{player.alive ? "" : " — morto"}</option>)}
            </select>
          </label>
        ))}
        <label className="grid gap-1 text-sm font-semibold">Observação opcional
          <input value={notes} maxLength={240} onChange={(event) => setNotes(event.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-[#161719] px-3 text-[#fffaf0]" />
        </label>
      </div>
      {entry && <p className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-sm text-[#e6cfa9]">{formatHostActionEntry(entry, context)}</p>}
      {issues.length > 0 && <ul className="mt-2 text-xs text-[#f0b9bd]">{issues.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul>}
      <button type="button" onClick={() => void handleSubmit()} disabled={busy || !entry || hasBlockingHostActionIssues(issues)} className="mt-3 min-h-11 w-full rounded-xl bg-[#7d2330] px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#5d5552]">{editingEntry ? "Salvar correção" : "Confirmar entrada"}</button>
      <p role="status" className="mt-2 min-h-5 text-sm text-[#bfe0c5]">{feedback}</p>
    </section>
  );
}
