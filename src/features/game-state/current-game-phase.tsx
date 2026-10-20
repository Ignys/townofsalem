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

  const night = game.phase === "night";
  const cycle = night
    ? game.nightNumber ? `Noite ${game.nightNumber}${isFullMoon ? ", lua cheia" : ""}` : null
    : game.day ? `Dia ${game.day}` : null;

  // Mesma voz do herói dos jogadores: ciclo pequeno, nome da fase em serif.
  return (
    <header>
      <p className={`flex items-center gap-2 text-sm font-semibold ${night ? "text-[#c9d4ef]" : "text-[#f2c879]"}`}>
        <PhaseIcon aria-hidden="true" size={20} strokeWidth={1.8} />
        {cycle ?? "Fase atual"}
      </p>
      <h2 className="mt-1 font-serif text-3xl leading-tight font-semibold tracking-[-0.02em] text-[#fffaf0]">
        {game.phaseLabel ?? GAME_PHASE_LABELS[game.phase]}
      </h2>
    </header>
  );
}
