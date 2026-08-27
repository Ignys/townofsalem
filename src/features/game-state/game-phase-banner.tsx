import type { GamePublicRecord } from "@/lib/firebase/schema";
import { GameTimerDisplay } from "@/features/timer/game-timer-display";

import { GAME_PHASE_LABELS } from "./game-phase-presentation";

interface GamePhaseBannerProps {
  game: GamePublicRecord;
}

export function GamePhaseBanner({ game }: GamePhaseBannerProps) {
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-xs font-bold tracking-wide text-[#9f9990] uppercase">
          Fase atual
        </span>
        <strong className="text-sm text-[#e6cfa9]">
          {game.phaseLabel ?? GAME_PHASE_LABELS[game.phase]}
          {game.phase === "night" && game.nightNumber ? ` ${game.nightNumber}` : ""}
        </strong>
      </div>
      {game.phase !== "night" && <GameTimerDisplay game={game} />}
    </section>
  );
}
