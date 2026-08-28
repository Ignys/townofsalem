import { ROLE_DEFINITIONS } from "@/data/roles";
import { formatHostActionEntry } from "@/features/night-actions/host-action-entry";
import { presentNightResolution } from "@/features/night-actions/night-resolution-presentation";
import { NightResolutionSections } from "@/features/night-actions/night-resolution-sections";
import type { HostNightActionEntry, NightResolutionRecord, NightSession, Player } from "@/types";

interface HostHistoryNightProps {
  session: NightSession;
  entries: readonly HostNightActionEntry[];
  record?: NightResolutionRecord;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  playerNames: Readonly<Record<string, string>>;
  onPlayerClick?: (playerUid: string) => void;
}

function getNightStatus(record?: NightResolutionRecord) {
  if (record?.rolledBackAt) {
    return { label: "rollback", className: "border-red-300/20 bg-red-400/10 text-red-200" };
  }
  if (record?.appliedAt) {
    return { label: "confirmada", className: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" };
  }
  return { label: "em andamento", className: "border-amber-300/20 bg-amber-400/10 text-amber-100" };
}

export function HostHistoryNight({
  session,
  entries,
  record,
  players,
  assignments,
  playerNames,
  onPlayerClick,
}: HostHistoryNightProps) {
  const orderedEntries = [...entries].sort((left, right) => left.createdAt - right.createdAt);
  const presentation = record
    ? presentNightResolution(record.resolution, playerNames, assignments)
    : null;
  const status = getNightStatus(record);

  return (
    <li>
      <details className="group rounded-lg border border-zinc-800 bg-zinc-900/45 open:bg-zinc-900/70">
        <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2 marker:hidden">
          <span className="font-medium text-zinc-100">
            Noite {session.nightNumber} · <span className="text-zinc-400">{orderedEntries.length} {orderedEntries.length === 1 ? "ação" : "ações"}</span>
          </span>
          <span className={`rounded-md border px-2 py-0.5 text-[0.6875rem] font-semibold uppercase ${status.className}`}>
            {status.label}
          </span>
        </summary>

        <div className="grid gap-3 border-t border-zinc-800 p-3">
          <section>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase">Action Log</h3>
            {orderedEntries.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Nenhuma ação registrada.</p>
            ) : (
              <ol className="mt-2 grid gap-1 text-sm text-zinc-300">
                {orderedEntries.map((entry, index) => (
                  <li key={entry.id} className={entry.status === "cancelled" ? "line-through opacity-50" : ""}>
                    {index + 1}. {formatHostActionEntry(entry, { players, assignments, roleDefinitions: ROLE_DEFINITIONS })}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {presentation ? (
            <NightResolutionSections
              presentation={presentation}
              onPlayerClick={onPlayerClick}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-700 p-3 text-sm text-zinc-500">
              A resolução desta noite ainda não foi confirmada.
            </p>
          )}
        </div>
      </details>
    </li>
  );
}
