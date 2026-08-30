"use client";

import type { HostNightActionEntry, Player } from "@/types";

import { getAvailableNightTargets, type NightConsoleInteraction } from "./night-console-interactions";
import { FACTION_STYLES } from "../roles/role-selection-options";
import { NightTargetCombobox } from "./night-target-combobox";
import { useHostNightConsoleAction } from "./use-host-night-console-action";
import type { GameVariants } from "@/game-engine/variants";

interface HostNightConsoleRowProps {
    gameId: string;
    nightId: string;
    nightNumber: number;
    interaction: NightConsoleInteraction;
    players: readonly Player[];
    assignments: Readonly<Record<string, string>>;
    existingEntry?: HostNightActionEntry;
    actionHistory: readonly HostNightActionEntry[];
    locked: boolean;
    variants: GameVariants;
}

export function HostNightConsoleRow({ gameId, nightId, nightNumber, interaction, players, assignments, existingEntry, actionHistory, locked, variants }: HostNightConsoleRowProps) {
    const { actor, role, action } = interaction;
    const availableTargets = getAvailableNightTargets(interaction, players, variants);
    const style = role ? FACTION_STYLES[role.faction] : FACTION_STYLES.neutral;
    const consoleAction = useHostNightConsoleAction({
        gameId,
        nightId,
        nightNumber,
        interaction,
        players,
        assignments,
        existingEntry,
        actionHistory,
        locked,
        variants,
    });

    return (
        <div
            tabIndex={-1}
            data-night-console-actor={actor.uid}
            data-night-console-action={action.id}
            className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg px-1 py-1 outline-none transition focus:bg-amber-400/10"
        >
            <span className="font-medium text-zinc-100">{actor.name}</span>
            <span className={`w-fit uppercase max-w-full truncate rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium text-[#e6cfa9] ${style.tag}`}>{role.id}</span>
            <span className="text-sm text-zinc-300">{action.verb}</span>
            {existingEntry?.source === "player" && (
                <span className="w-fit shrink-0 rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-sky-100">
                    Enviado pelo jogador
                </span>
            )}
            {existingEntry?.source === "player" && existingEntry.status === "draft" && (
                <span className="w-fit shrink-0 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-amber-100">
                    Rascunho: revisar
                </span>
            )}

            {action.targetCount === 0
                ? <button type="button" disabled={locked || consoleAction.noTargetActionRecorded} onClick={consoleAction.recordNoTargetAction} className="min-h-9 rounded-lg border border-amber-300/25 px-3 text-xs font-semibold text-amber-100 disabled:opacity-50">{consoleAction.noTargetActionRecorded ? "Registrada" : "Registrar"}</button>
                : Array.from({ length: action.targetCount }, (_, targetIndex) => (
                      <NightTargetCombobox
                          key={targetIndex}
                          ariaLabel={`Alvo ${targetIndex + 1} de ${actor.name} para ${action.label}`}
                          players={availableTargets}
                          assignments={assignments}
                          value={consoleAction.selectedTargetUids[targetIndex] ?? ""}
                          onChange={(playerUid) => consoleAction.setTarget(targetIndex, playerUid)}
                          disabled={locked}
                      />
                  ))}
        </div>
    );
}
