import type { StoredGameEvent } from "@/lib/firebase/schema";

interface HostEventHistoryProps {
  events: readonly (readonly [string, StoredGameEvent])[];
}

export function HostEventHistory({ events }: HostEventHistoryProps) {
  return (
    <details className="rounded-lg border border-zinc-800 bg-black/15">
      <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-medium text-zinc-300">
        Event History técnico · {events.length} {events.length === 1 ? "evento" : "eventos"}
      </summary>
      <div className="border-t border-zinc-800 p-3">
        {events.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum evento técnico registrado.</p>
        ) : (
          <ol className="grid gap-2 font-mono text-xs text-zinc-500">
            {events.map(([id, event]) => (
              <li key={id} className="grid gap-0.5 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-3">
                <time dateTime={new Date(event.timestamp).toISOString()}>
                  {new Date(event.timestamp).toLocaleString("pt-BR")}
                </time>
                <span className="break-words text-zinc-400">{event.type}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
