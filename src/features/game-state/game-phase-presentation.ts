import type { GamePhase } from "@/types";

export const GAME_PHASE_LABELS: Record<GamePhase, string> = {
  lobby: "Lobby",
  day: "Dia",
  discussion: "Discussão",
  trial: "Julgamento",
  defense: "Defesa",
  verdict: "Veredito",
  night: "Noite",
  custom: "Personalizada",
  "game-over": "Fim de jogo",
};
