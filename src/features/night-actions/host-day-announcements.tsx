"use client";

import { DayAnnouncementCard } from "./player-night-results-cards";
import { useDayAnnouncement } from "./use-player-night-results";

/** O mesmo anúncio que os jogadores veem ao amanhecer, para o mestre ler em voz alta. */
export function HostDayAnnouncements({ gameId }: Readonly<{ gameId: string }>) {
  const announcement = useDayAnnouncement(gameId, true);
  return announcement ? <DayAnnouncementCard announcement={announcement} /> : null;
}
