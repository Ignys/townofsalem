"use client";

import { useState } from "react";

import type { GamePublicRecord } from "@/lib/firebase/schema";

import { TimerReadout } from "./timer-readout";
import { useSynchronizedTimer } from "./use-synchronized-timer";

interface GameTimerDisplayProps {
  game: GamePublicRecord;
}

export function GameTimerDisplay({ game }: GameTimerDisplayProps) {
  const timer = useSynchronizedTimer(game);
  // A partida não guarda a duração da fase: vale o maior tempo restante visto nesta fase.
  // ponytail: quem entra no meio da fase vê a barra começar cheia; guardar a duração no
  // registro público resolve se isso incomodar.
  const phaseKey = `${game.phase}:${game.day}:${game.nightNumber}`;
  const [peak, setPeak] = useState({ phaseKey, totalMs: timer.remainingMs });
  if (peak.phaseKey !== phaseKey || timer.remainingMs > peak.totalMs) {
    setPeak({ phaseKey, totalMs: timer.remainingMs });
  }

  return <TimerReadout timer={timer} totalMs={peak.totalMs || null} />;
}
