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

/** Tempo que o Jester enforcado tem para escolher a vingança, contado do fim da votação. */
export const JESTER_REVENGE_WINDOW_MS = 30_000;

/** Jester enforcado com vingança em aberto, e o alvo que ele já escolheu (se escolheu). */
export interface PendingJesterRevenge {
  jesterUid: string;
  targetUid: string | null;
}

export type HostlessStep =
  | { kind: "declare-winner"; winningFactions: readonly string[]; winningPlayerUids: readonly string[] }
  | { kind: "start-timer"; seconds: number }
  | { kind: "end-night" }
  | { kind: "start-night" }
  | { kind: "start-verdict" }
  | { kind: "close-verdict" }
  | { kind: "apply-lynch"; targetUid: string }
  | { kind: "resolve-jester-revenge"; jesterUid: string; targetUid: string | null };

/**
 * O próximo passo do motor sem mestre. Puro: recebe o estado público e o estado do timer,
 * e devolve no máximo uma ação. Chamado a cada tick; repetir o mesmo passo é seguro.
 */
export function decideHostlessStep(
  game: Pick<GamePublicRecord, "status" | "phase" | "accusedPlayerUid" | "verdictClosedAt" | "verdictOutcome">,
  timerStatus: TimerStatus,
  isAlive: (uid: string) => boolean,
  now: number,
  winner: { gameOver: boolean; winningFactions: readonly string[]; winningPlayerUids: readonly string[] } | null = null,
  jesterRevenge: PendingJesterRevenge | null = null,
): HostlessStep | null {
  if (game.status !== "in-progress") return null;

  const showingVerdictResult = game.phase === "verdict"
    && Boolean(game.verdictClosedAt)
    && now - (game.verdictClosedAt ?? 0) < VERDICT_RESULT_DISPLAY_MS;

  // A vitória vale antes de qualquer outra coisa, mas espera a lista de votos sair da tela
  // e a vingança do Jester (que ainda pode matar alguém).
  if (winner?.gameOver && !showingVerdictResult && !jesterRevenge) {
    return {
      kind: "declare-winner",
      winningFactions: winner.winningFactions,
      winningPlayerUids: winner.winningPlayerUids,
    };
  }

  // Veredito fechado: aplica o linchamento (se culpado) e segue para a noite.
  if (game.phase === "verdict" && game.verdictClosedAt) {
    if (game.verdictOutcome === "guilty" && game.accusedPlayerUid && isAlive(game.accusedPlayerUid)) {
      return { kind: "apply-lynch", targetUid: game.accusedPlayerUid };
    }
    // O Jester enforcado escolhe na hora; sem escolha no prazo, a vingança não acontece.
    if (jesterRevenge) {
      if (jesterRevenge.targetUid) {
        return { kind: "resolve-jester-revenge", ...jesterRevenge };
      }
      return now - game.verdictClosedAt >= JESTER_REVENGE_WINDOW_MS
        ? { kind: "resolve-jester-revenge", jesterUid: jesterRevenge.jesterUid, targetUid: null }
        : null;
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
