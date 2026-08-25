"use client";

import type { GamePublicRecord } from "@/lib/firebase/schema";

import { TimerReadout } from "./timer-readout";
import { useSynchronizedTimer } from "./use-synchronized-timer";

interface GameTimerDisplayProps {
  game: GamePublicRecord;
}

export function GameTimerDisplay({ game }: GameTimerDisplayProps) {
  const timer = useSynchronizedTimer(game);

  return <TimerReadout timer={timer} />;
}
