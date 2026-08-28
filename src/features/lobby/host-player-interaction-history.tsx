import { History } from "lucide-react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import type { HostNightActionEntry } from "@/types";

import { getPlayerInteractionHistory } from "./player-interaction-history";

interface HostPlayerInteractionHistoryProps {
  actionEntries: readonly HostNightActionEntry[];
  loaded: boolean;
  nightNumberById: Readonly<Record<string, number>>;
  playerNames: Readonly<Record<string, string>>;
  playerUid: string;
}

export function HostPlayerInteractionHistory({
  actionEntries,
  loaded,
  nightNumberById,
  playerNames,
  playerUid,
}: HostPlayerInteractionHistoryProps) {
  const history = getPlayerInteractionHistory({
    actionEntries,
    playerUid,
    playerNames,
    nightNumberById,
    roleDefinitions: ROLE_DEFINITIONS,
  });

  return (
    <section className="rounded-xl border border-white/8 bg-black/15 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#9f9990] uppercase">
        <History aria-hidden="true" size={15} />
        Interações registradas
      </p>

      {!loaded ? (
        <p role="status" className="mt-3 text-sm text-[#9f9990]">
          Carregando interações…
        </p>
      ) : history.length === 0 ? (
        <p className="mt-3 text-sm text-[#9f9990]">
          Nenhuma interação registrada.
        </p>
      ) : (
        <ol className="mt-3 grid gap-3">
          {history.map((night) => (
            <li key={night.nightId} className="border-l-2 border-[#d3b88c]/25 pl-3">
              <p className="text-xs font-bold text-[#e6cfa9]">
                {night.nightNumber !== undefined
                  ? `Noite ${night.nightNumber}`
                  : "Noite registrada"}
              </p>
              <ul className="mt-1 grid gap-1.5">
                {night.interactions.map((interaction) => (
                  <li key={interaction.id} className="text-sm leading-5 text-[#d8d2c8]">
                    <div className="flex items-start justify-between gap-2">
                      <span>{interaction.description}</span>
                      {interaction.status === "draft" && (
                        <span className="shrink-0 rounded border border-amber-300/20 bg-amber-400/10 px-1.5 py-0.5 text-[0.625rem] font-semibold text-amber-100 uppercase">
                          Rascunho
                        </span>
                      )}
                    </div>
                    {interaction.notes && (
                      <p className="mt-0.5 text-xs text-[#9f9990]">
                        {interaction.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
