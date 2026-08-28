"use client";

import { useMemo, useState } from "react";

import { HostConsoleFrame } from "@/components/host/host-console-frame";
import { HostPlayerDetailsModal } from "@/features/lobby/host-player-details-modal";
import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import type { PublicPlayerRecord } from "@/lib/firebase/schema";
import type { Player } from "@/types";

import { HostEventHistory } from "./host-event-history";
import { HostHistoryNight } from "./host-history-night";
import { getPlayerDeathDetailsByUid } from "./player-death-details";
import { useHostHistory } from "./use-host-history";

interface HostHistoryPanelProps {
  gameId: string;
  hostUid: string;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

export function HostHistoryPanel({ gameId, hostUid, players: playerRecords }: HostHistoryPanelProps) {
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);
  const history = useHostHistory(gameId, hostUid);
  const roles = useHostRoleAssignments(gameId, hostUid);
  const players = useMemo<Player[]>(
    () => Object.entries(playerRecords).map(([uid, player]) => ({
      id: uid,
      uid,
      ...player,
      statuses: Object.values(roles.assignments[uid]?.statuses ?? {}),
      originalRoleId: roles.assignments[uid]?.originalRoleId,
    })),
    [playerRecords, roles.assignments],
  );
  const assignments = useMemo(
    () => Object.fromEntries(Object.entries(roles.assignments).map(([uid, value]) => [uid, value.roleId])),
    [roles.assignments],
  );
  const playerNames = useMemo(
    () => Object.fromEntries(players.map(({ uid, name }) => [uid, name])),
    [players],
  );
  const actionHistory = useMemo(
    () => Object.values(history.actions).flatMap((entries) => Object.values(entries)),
    [history.actions],
  );
  const nightNumberById = useMemo(
    () => Object.fromEntries(Object.values(history.sessions).map((session) => [session.id, session.nightNumber])),
    [history.sessions],
  );
  const deathDetailsByPlayer = useMemo(() => getPlayerDeathDetailsByUid({
    events: history.events,
    playerNames,
    resolutions: history.resolutions,
  }), [history.events, history.resolutions, playerNames]);
  const sessions = Object.values(history.sessions).sort((left, right) => right.nightNumber - left.nightNumber);
  const events = Object.entries(history.events)
    .sort(([, left], [, right]) => right.timestamp - left.timestamp)
    .slice(0, 30);
  const loaded = history.loaded && roles.loaded;
  const error = history.error ?? roles.error;

  const exportHistory = () => {
    const payload = JSON.stringify({
      gameId,
      nightSessions: history.sessions,
      actionLog: history.actions,
      nightResolutions: history.resolutions,
      eventHistory: history.events,
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `town-of-salem-${gameId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <HostConsoleFrame
        title="Histórico da partida"
        actions={(
          <button
            type="button"
            disabled={!history.loaded}
            onClick={exportHistory}
            className="min-h-9 rounded-lg border border-zinc-700 px-3 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04] disabled:opacity-50"
          >
            Exportar JSON
          </button>
        )}
      >
        {!loaded && !error && (
          <p role="status" className="py-5 text-center text-sm text-zinc-500">
            Carregando histórico…
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">
            Histórico indisponível.
          </p>
        )}

        {loaded && !error && (
          <div className="grid gap-3">
            {sessions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">
                Nenhuma noite registrada.
              </p>
            ) : (
              <ol className="grid gap-2">
                {sessions.map((session) => (
                  <HostHistoryNight
                    key={session.id}
                    session={session}
                    entries={Object.values(history.actions[session.id] ?? {})}
                    record={history.resolutions[session.id]}
                    players={players}
                    assignments={assignments}
                    playerNames={playerNames}
                    onPlayerClick={setSelectedPlayerUid}
                  />
                ))}
              </ol>
            )}
            <HostEventHistory events={events} />
          </div>
        )}
      </HostConsoleFrame>
      <HostPlayerDetailsModal
        gameId={gameId}
        playerUid={selectedPlayerUid}
        players={players}
        privatePlayers={roles.assignments}
        actionHistory={actionHistory}
        actionHistoryLoaded={history.loaded}
        nightNumberById={nightNumberById}
        playerNames={playerNames}
        deathDetailsByPlayer={deathDetailsByPlayer}
        onClose={() => setSelectedPlayerUid(null)}
      />
    </>
  );
}
