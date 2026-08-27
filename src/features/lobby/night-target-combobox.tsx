"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { getRoleById } from "@/data/roles";
import type { Player } from "@/types";

import { FACTION_STYLES } from "../roles/role-selection-options";

interface NightTargetComboboxProps {
    ariaLabel: string;
    players: readonly Player[];
    assignments: Readonly<Record<string, string>>;
    value: string;
    onChange: (playerUid: string) => void;
    disabled?: boolean;
}

function PlayerRoleTag({ roleId }: Readonly<{ roleId?: string }>) {
    const role = roleId ? getRoleById(roleId) : undefined;
    const style = role ? FACTION_STYLES[role.faction] : FACTION_STYLES.neutral;

    return (
        <span className={`max-w-32 shrink-0 truncate rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium uppercase ${style.tag}`}>
            {roleId ?? "sem role"}
        </span>
    );
}

export function NightTargetCombobox({ ariaLabel, players, assignments, value, onChange, disabled }: NightTargetComboboxProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxId = useId();
    const selectedPlayer = players.find((player) => player.uid === value);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

    const openList = () => {
        const selectedIndex = players.findIndex((player) => player.uid === value);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex + 1 : 0);
        setOpen(true);
    };

    const selectValue = (playerUid: string) => {
        onChange(playerUid);
        setOpen(false);
        triggerRef.current?.focus();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        const optionCount = players.length + 1;

        if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) selectValue(activeIndex === 0 ? "" : players[activeIndex - 1].uid);
            else openList();
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
                openList();
                return;
            }

            const direction = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((current) => (current + direction + optionCount) % optionCount);
        }
    };

    const activeOptionId = open ? `${listboxId}-option-${activeIndex}` : undefined;

    return (
        <div ref={rootRef} className="relative w-fit flex-1">
            <button
                ref={triggerRef}
                type="button"
                role="combobox"
                aria-label={ariaLabel}
                aria-controls={listboxId}
                aria-expanded={open}
                aria-activedescendant={activeOptionId}
                aria-haspopup="listbox"
                disabled={disabled}
                onClick={() => open ? setOpen(false) : openList()}
                onKeyDown={handleKeyDown}
                className="flex min-h-8 w-fit items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-900/50 px-2 pr-1 text-left text-sm text-zinc-100 outline-none transition hover:border-zinc-600 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span className="min-w-0 mr-1 truncate">{selectedPlayer?.name ?? "Selecionar"}</span>
                {selectedPlayer && <PlayerRoleTag roleId={assignments[selectedPlayer.uid]} />}
                <ChevronDown aria-hidden="true" size={16} className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div
                    id={listboxId}
                    role="listbox"
                    aria-label={ariaLabel}
                    className="absolute w-fit top-full right-0 left-0 z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 p-1 shadow-xl shadow-black/40"
                >
                    <div
                        id={`${listboxId}-option-0`}
                        role="option"
                        aria-selected={!value}
                        onMouseEnter={() => setActiveIndex(0)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectValue("")}
                        className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm ${activeIndex === 0 ? "bg-zinc-500/40 text-white" : "text-zinc-300"}`}
                    >
                        <span className="flex">Selecionar</span>
                       
                    </div>

                    {players.map((player, index) => {
                        const optionIndex = index + 1;
                        const selected = player.uid === value;

                        return (
                            <div
                                key={player.uid}
                                id={`${listboxId}-option-${optionIndex}`}
                                role="option"
                                aria-selected={selected}
                                onMouseEnter={() => setActiveIndex(optionIndex)}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => selectValue(player.uid)}
                                className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm ${activeIndex === optionIndex ? "bg-zinc-500/40 text-white" : "text-zinc-100"}`}
                            >
                                <span className="min-w-0 truncate">{player.name}</span>
                                <PlayerRoleTag roleId={assignments[player.uid]} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
