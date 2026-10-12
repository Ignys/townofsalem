/**
 * Ponte entre o preview da noite e o painel de fases: sair da noite aplica o resultado.
 *
 * O preview (que já tem tudo calculado) registra aqui como aplicar a noite atual; o painel
 * de fases chama `applyNightBeforeLeaving` antes de iniciar a próxima fase.
 */
export type NightApplyOutcome =
  | { kind: "applied" }
  | { kind: "already-applied" }
  | { kind: "blocked"; reason: string };

type NightApplier = () => Promise<NightApplyOutcome>;

const appliers = new Map<string, NightApplier>();

export function registerNightApplier(gameId: string, applier: NightApplier): () => void {
  appliers.set(gameId, applier);
  return () => {
    if (appliers.get(gameId) === applier) appliers.delete(gameId);
  };
}

export async function applyNightBeforeLeaving(gameId: string): Promise<NightApplyOutcome> {
  const applier = appliers.get(gameId);
  if (!applier) {
    return { kind: "blocked", reason: "A resolução da noite ainda está carregando. Tente de novo em instantes." };
  }
  return applier();
}
