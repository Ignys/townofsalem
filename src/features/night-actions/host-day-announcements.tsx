"use client";

import { Megaphone } from "lucide-react";

import { HostConsoleFrame } from "@/components/host/host-console-frame";

import { NightResolutionMessage } from "./night-resolution-message";
import { useDayAnnouncement } from "./use-player-night-results";

/** O mesmo anúncio que os jogadores veem ao amanhecer, para o mestre ler em voz alta. */
export function HostDayAnnouncements({ gameId }: Readonly<{ gameId: string }>) {
  const announcement = useDayAnnouncement(gameId, true);
  if (!announcement) return null;

  return (
    <HostConsoleFrame title={`Anúncios do dia · Noite ${announcement.nightNumber}`} contentClassName="mt-3">
      <div className="flex items-start gap-3">
        <span className="text-zinc-400">
          <Megaphone aria-hidden="true" />
        </span>
        <ul className="grid gap-1 text-sm text-zinc-300">
          {announcement.lines.map((line, index) => (
            <li key={index}>
              <NightResolutionMessage line={line} />
            </li>
          ))}
        </ul>
      </div>
    </HostConsoleFrame>
  );
}
