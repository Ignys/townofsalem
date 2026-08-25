"use client";

import { useState } from "react";

import type { PlayerStatus } from "@/types";

interface HostPlayerStatusControlProps {
  gameId: string;
  playerUid: string;
  roleId?: string;
  statuses?: Readonly<Record<string, PlayerStatus>>;
  disabled?: boolean;
}

interface StatusOption {
  id: "cleaned" | "mayor-revealed";
  activeLabel: string;
  inactiveLabel: string;
}

const CLEANED_STATUS: StatusOption = {
  id: "cleaned",
  activeLabel: "Remover status limpo",
  inactiveLabel: "Marcar corpo limpo",
};

const MAYOR_STATUS: StatusOption = {
  id: "mayor-revealed",
  activeLabel: "Desfazer revelação",
  inactiveLabel: "Revelar Mayor",
};

export function HostPlayerStatusControl({
  gameId,
  playerUid,
  roleId,
  statuses = {},
  disabled,
}: HostPlayerStatusControlProps) {
  const [busyStatus, setBusyStatus] = useState<string | null>(null);
  const options = roleId === "mayor"
    ? [CLEANED_STATUS, MAYOR_STATUS]
    : [CLEANED_STATUS];

  const toggle = async (option: StatusOption) => {
    const active = Boolean(statuses[option.id]);
    if (busyStatus || (active && !window.confirm(`Confirmar: ${option.activeLabel.toLowerCase()}?`))) return;
    setBusyStatus(option.id);
    try {
      const { updatePlayerStatus } = await import("./update-player-status");
      await updatePlayerStatus(gameId, playerUid, option.id, !active);
    } finally {
      setBusyStatus(null);
    }
  };

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {options.map((option) => {
        const active = Boolean(statuses[option.id]);
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled || Boolean(busyStatus)}
            onClick={() => void toggle(option)}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs text-[#bdb7ad] disabled:opacity-50"
          >
            {active ? option.activeLabel : option.inactiveLabel}
          </button>
        );
      })}
    </div>
  );
}
