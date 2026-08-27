import {
  Gavel,
  MessagesSquare,
  Moon,
  Scale,
  Shield,
  Sun,
  TimerReset,
  Trophy,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { GamePublicRecord } from "@/lib/firebase/schema";
import type { GamePhase } from "@/types";

import { GAME_PHASE_LABELS } from "./game-phase-presentation";

const PHASE_ICONS: Record<GamePhase, LucideIcon> = {
  lobby: UsersRound,
  day: Sun,
  discussion: MessagesSquare,
  trial: Gavel,
  defense: Shield,
  verdict: Scale,
  night: Moon,
  custom: TimerReset,
  "game-over": Trophy,
};

interface CurrentGamePhaseProps {
  game: GamePublicRecord;
}

export function CurrentGamePhase({ game }: CurrentGamePhaseProps) {
  const PhaseIcon = PHASE_ICONS[game.phase];
  const isFullMoon =
    game.phase === "night" && Boolean(game.nightNumber && game.nightNumber % 2 === 0);

  return (
    <header className="flex items-center gap-3">
      <span
        className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#d3b88c]/30 bg-[#d3b88c]/10 text-[#e6cfa9] shadow-[inset_0_0_18px_rgba(211,184,140,0.08)]"
        aria-hidden="true"
      >
        <PhaseIcon size={26} strokeWidth={1.8} />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-bold tracking-[0.18em] text-[#d3b88c] uppercase">
          Fase atual
        </p>
        <h2 className="mt-0.5 text-2xl leading-tight font-semibold text-[#fffaf0] uppercase">
          {game.phaseLabel ?? GAME_PHASE_LABELS[game.phase]}
          {game.phase === "night" && game.nightNumber ? ` ${game.nightNumber}` : ""}
          {isFullMoon ? " - Lua cheia" : ""}
        </h2>
      </div>
    </header>
  );
}
