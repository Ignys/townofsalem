import type { TimerStatus } from "@/features/timer/timer-state";
import type { GamePace, GamePublicRecord } from "@/lib/firebase/schema";
import type { GamePhase } from "@/types";

/** Tempos do modo sem mestre por ritmo. O rápido usa os tempos do normal e encerra antes. */
export const HOSTLESS_PACE_SECONDS: Record<GamePace, Partial<Record<GamePhase, number>>> = {
  relaxed: { night: 90, discussion: 300, trial: 30, verdict: 30 },
  normal: { night: 60, discussion: 180, trial: 30, verdict: 30 },
  fast: { night: 60, discussion: 180, trial: 30, verdict: 30 },
};

/** Tempos do ritmo "Relaxed" (padrão). */
export const HOSTLESS_PHASE_SECONDS = HOSTLESS_PACE_SECONDS.relaxed;

export const GAME_PACE_LABELS: Record<GamePace, { title: string; description: string }> = {
  relaxed: { title: "Relaxed", description: "Noite 1m30 · Discussão 5m · Defesa 30s · Votação 30s" },
  normal: { title: "Normal", description: "Noite 1m · Discussão 3m · Defesa 30s · Votação 30s" },
  fast: {
    title: "Fast track",
    description: "Tempos do Normal, mas a noite acaba quando todos agem e a votação quando todos votam.",
  },
};

/** Sinais do ritmo rápido: todo mundo já agiu à noite / já votou no veredito. */
export interface FastTrackSignals {
  nightComplete: boolean;
  allVerdictsIn: boolean;
}

/** No modo sem mestre o acusado se defende no julgamento e a cidade vota no veredito. */
export const HOSTLESS_PHASE_LABELS = {
  trial: "Defesa",
  verdict: "Votação",
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
  pace: GamePace = "relaxed",
  fast: FastTrackSignals = { nightComplete: false, allVerdictsIn: false },
): HostlessStep | null {
  const seconds = HOSTLESS_PACE_SECONDS[pace];
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

  // Ritmo rápido: cada fase acaba assim que todos fizeram sua parte (a defesa tem tempo fixo).
  if (pace === "fast") {
    // Vale com o timer correndo ou pausado: se todos já fizeram sua parte, não há o que esperar.
    const ticking = timerStatus === "running" || timerStatus === "paused";
    if (ticking && game.phase === "night" && fast.nightComplete) return { kind: "end-night" };
    if (ticking && game.phase === "verdict" && !game.verdictClosedAt && fast.allVerdictsIn) return { kind: "close-verdict" };
  }

  if (timerStatus === "idle") {
    const phaseSeconds = seconds[game.phase];
    return phaseSeconds ? { kind: "start-timer", seconds: phaseSeconds } : null;
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
