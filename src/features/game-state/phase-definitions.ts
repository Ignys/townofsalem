import type { PhaseDefinition, PlayablePhase } from "@/types";

const CURRENT_TIMER_DEFAULT_SECONDS = 60;

export const PHASE_DEFINITIONS = [
  { id: "day", label: "Dia", hasTimer: true, defaultDurationSeconds: CURRENT_TIMER_DEFAULT_SECONDS },
  { id: "discussion", label: "Discussão", hasTimer: true, defaultDurationSeconds: CURRENT_TIMER_DEFAULT_SECONDS },
  { id: "trial", label: "Julgamento", hasTimer: true, defaultDurationSeconds: CURRENT_TIMER_DEFAULT_SECONDS },
  { id: "defense", label: "Defesa", hasTimer: true, defaultDurationSeconds: CURRENT_TIMER_DEFAULT_SECONDS },
  { id: "verdict", label: "Veredito", hasTimer: true, defaultDurationSeconds: CURRENT_TIMER_DEFAULT_SECONDS },
  { id: "night", label: "Noite", hasTimer: true, defaultDurationSeconds: CURRENT_TIMER_DEFAULT_SECONDS },
] as const satisfies readonly PhaseDefinition[];

const definitionsById = new Map<PlayablePhase, PhaseDefinition>(
  PHASE_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function getPhaseDefinition(phase: PlayablePhase): PhaseDefinition {
  const definition = definitionsById.get(phase);

  if (!definition) {
    throw new Error(`Unknown playable phase: ${phase}`);
  }

  return definition;
}
