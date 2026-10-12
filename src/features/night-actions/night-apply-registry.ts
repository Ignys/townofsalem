/**
 * Ponte entre o preview da noite e o painel de fases: sair da noite aplica o resultado.
 *
 * O preview (que já tem tudo calculado) registra aqui como aplicar a noite atual; o painel
 * de fases chama `applyNightBeforeLeaving` antes de iniciar a próxima fase.
 */
export type NightApplyOutcome =
  | { kind: "applied" }
  | { kind: "already-applied" }
  | { kind: "loading" }
  | { kind: "blocked"; reason: string };

/** Quanto esperar o preview da noite ficar pronto (ex.: mestre clicou logo após sortear). */
const LOADING_WAIT_MS = 5_000;
const LOADING_POLL_MS = 200;
const LOADING_REASON = "A resolução da noite ainda está carregando. Tente de novo em instantes.";

type NightApplier = () => Promise<NightApplyOutcome>;

const appliers = new Map<string, NightApplier>();

export function registerNightApplier(gameId: string, applier: NightApplier): () => void {
  appliers.set(gameId, applier);
  return () => {
    if (appliers.get(gameId) === applier) appliers.delete(gameId);
  };
}

export async function applyNightBeforeLeaving(
  gameId: string,
  waitMs: number = LOADING_WAIT_MS,
): Promise<Exclude<NightApplyOutcome, { kind: "loading" }>> {
  const deadline = Date.now() + waitMs;
  for (;;) {
    const applier = appliers.get(gameId);
    const outcome: NightApplyOutcome = applier ? await applier() : { kind: "loading" };
    if (outcome.kind !== "loading") return outcome;
    if (Date.now() >= deadline) return { kind: "blocked", reason: LOADING_REASON };
    await new Promise((resolve) => setTimeout(resolve, LOADING_POLL_MS));
  }
}
