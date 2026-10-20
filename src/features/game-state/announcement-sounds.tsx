"use client";

import { useEffect, useRef } from "react";

import { useGameVariants } from "@/features/game-variants/use-game-variants";
import type { GameVariants } from "@/game-engine/variants";
import type { GamePublicRecord } from "@/lib/firebase/schema";

type Device = "players" | "host";

function play(src: string) {
  // Navegadores bloqueiam áudio antes do primeiro toque; nesse caso só não toca.
  void new Audio(src).play().catch(() => undefined);
}

/** Toca Wolves ao cair a noite, Rooster ao começar a discussão e ChurchBell quando alguém vai a julgamento. */
export function useAnnouncementSounds(
  game: Pick<GamePublicRecord, "phase" | "accusedPlayerUid">,
  setting: GameVariants["announcementSounds"],
  device: Device,
) {
  const enabled = setting === "both" || setting === device;
  const night = game.phase === "night";
  const discussion = game.phase === "discussion";
  const accused = game.accusedPlayerUid ?? null;
  // Começa com o estado atual: entrar/recarregar no meio da noite não toca nada.
  const previous = useRef({ night, discussion, accused });

  useEffect(() => {
    const before = previous.current;
    previous.current = { night, discussion, accused };
    if (!enabled) return;
    if (night && !before.night) play("/sounds/Wolves.mp3");
    if (discussion && !before.discussion) play("/sounds/Rooster.ogg");
    if (accused && accused !== before.accused) play("/sounds/ChurchBell.mp3");
  }, [enabled, night, discussion, accused]);
}

export function HostAnnouncementSounds({ gameId, game }: Readonly<{ gameId: string; game: GamePublicRecord }>) {
  const { variants } = useGameVariants(gameId);
  useAnnouncementSounds(game, variants.announcementSounds, "host");
  return null;
}
