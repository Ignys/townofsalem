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

/**
 * No modo sem mestre o dia começa com a preparação (resultados da noite), o acusado se
 * defende no julgamento e a cidade vota no veredito.
 */
export const HOSTLESS_PHASE_LABELS = {
  day: "Preparação",
  trial: "Defesa",
  verdict: "Votação",
} as const;

/** Quanto tempo o resultado da votação fica na tela antes da noite começar. */
export const VERDICT_RESULT_DISPLAY_MS = 10_000;

/** Jester enforcado com vingança em aberto, e o alvo que ele já escolheu (se escolheu). */
export interface PendingJesterRevenge {
  jesterUid: string;
  targetUid: string | null;
}

export type HostlessStep =
  | { kind: "declare-winner"; winningFactions: readonly string[]; winningPlayerUids: readonly string[] }
  | { kind: "start-timer"; seconds: number }
  | { kind: "end-night" }
  | { kind: "start-discussion" }
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
  allDawnReady = false,
): HostlessStep | null {
  const seconds = HOSTLESS_PACE_SECONDS[pace];
  if (game.status !== "in-progress") return null;

  const showingVerdictResult = game.phase === "verdict"
    && Boolean(game.verdictClosedAt)
    && now - (game.verdictClosedAt ?? 0) < VERDICT_RESULT_DISPLAY_MS;

  // A vitória espera a lista de votos sair da tela e a vingança do Jester (que ainda pode
  // matar alguém). Se acontecer de noite, a noite termina e a cidade lê na preparação quem
  // morreu: a vitória só aparece quando todos os vivos apertam "Pronto".
  const holdWinner = showingVerdictResult
    || Boolean(jesterRevenge)
    || game.phase === "night"
    || (game.phase === "day" && !allDawnReady);
  if (winner?.gameOver && !holdWinner) {
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
    // A vingança do Jester enforcado é uma ação da noite seguinte: não segura o dia.
    // Deixa a lista de culpados/inocentes na tela por um momento antes da noite.
    return now - game.verdictClosedAt >= VERDICT_RESULT_DISPLAY_MS ? { kind: "start-night" } : null;
  }

  // Fim da noite: a vingança do Jester (escolhida durante a noite) acontece antes do resto.
  // Sem escolha até aqui, ela é descartada.
  const nightOver = game.phase === "night"
    && (timerStatus === "expired"
      || (pace === "fast" && (timerStatus === "running" || timerStatus === "paused") && fast.nightComplete));
  if (nightOver && jesterRevenge) {
    return { kind: "resolve-jester-revenge", ...jesterRevenge };
  }

  // Preparação: sem timer, acaba quando todos os vivos leram os resultados da noite
  // (ou quando a mesa pula a fase).
  if (game.phase === "day" && allDawnReady) return { kind: "start-discussion" };

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
