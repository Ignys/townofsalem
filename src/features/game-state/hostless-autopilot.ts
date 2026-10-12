import type { TimerStatus } from "@/features/timer/timer-state";
import type { GamePublicRecord } from "@/lib/firebase/schema";
import type { GamePhase } from "@/types";

/** Tempos do modo sem mestre (opção "Relaxed"). */
export const HOSTLESS_PHASE_SECONDS: Partial<Record<GamePhase, number>> = {
  night: 90,
  discussion: 300,
  trial: 15,
  verdict: 60,
};

/** No modo sem mestre a defesa e a votação acontecem juntas, na fase de veredito. */
export const HOSTLESS_PHASE_LABELS = {
  trial: "Preparação",
  verdict: "Defesa e votação",
} as const;

/** Quanto tempo o resultado da votação fica na tela antes da noite começar. */
export const VERDICT_RESULT_DISPLAY_MS = 10_000;

export type HostlessStep =
  | { kind: "start-timer"; seconds: number }
  | { kind: "end-night" }
  | { kind: "start-night" }
  | { kind: "start-verdict" }
  | { kind: "close-verdict" }
  | { kind: "apply-lynch"; targetUid: string };

/**
 * O próximo passo do motor sem mestre. Puro: recebe o estado público e o estado do timer,
 * e devolve no máximo uma ação. Chamado a cada tick; repetir o mesmo passo é seguro.
 */
export function decideHostlessStep(
  game: Pick<GamePublicRecord, "status" | "phase" | "accusedPlayerUid" | "verdictClosedAt" | "verdictOutcome">,
  timerStatus: TimerStatus,
  isAlive: (uid: string) => boolean,
  now: number,
): HostlessStep | null {
  if (game.status !== "in-progress") return null;

  // Veredito fechado: aplica o linchamento (se culpado) e segue para a noite.
  if (game.phase === "verdict" && game.verdictClosedAt) {
    if (game.verdictOutcome === "guilty" && game.accusedPlayerUid && isAlive(game.accusedPlayerUid)) {
      return { kind: "apply-lynch", targetUid: game.accusedPlayerUid };
    }
    // Deixa a lista de culpados/inocentes na tela por um momento antes da noite.
    return now - game.verdictClosedAt >= VERDICT_RESULT_DISPLAY_MS ? { kind: "start-night" } : null;
  }

  if (timerStatus === "idle") {
    const seconds = HOSTLESS_PHASE_SECONDS[game.phase];
    return seconds ? { kind: "start-timer", seconds } : null;
  }
  if (timerStatus !== "expired") return null;

  switch (game.phase) {
    case "night":
      return { kind: "end-night" };
    case "day":
    case "discussion":
      // Um julgamento em andamento tem a própria fase; sem acusado, o dia acabou.
      return game.accusedPlayerUid ? null : { kind: "start-night" };
    case "trial":
      return { kind: "start-verdict" };
    case "verdict":
      return { kind: "close-verdict" };
    default:
      return null;
  }
}
