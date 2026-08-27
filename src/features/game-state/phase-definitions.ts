import type { PhaseDefinition, PlayablePhase } from "@/types";

const CURRENT_TIMER_DEFAULT_SECONDS = 60;

export const PHASE_DEFINITIONS = [
  { id: "day", label: "Dia", hasTimer: true, defaultDurationSeconds: null },
  { id: "discussion", label: "Discussão", hasTimer: true, defaultDurationSeconds: 120 },
  { id: "trial", label: "Julgamento", hasTimer: true, defaultDurationSeconds: CURRENT_TIMER_DEFAULT_SECONDS },
  { id: "defense", label: "Defesa", hasTimer: true, defaultDurationSeconds: 30 },
  { id: "verdict", label: "Veredito", hasTimer: true, defaultDurationSeconds: 30 },
  { id: "night", label: "Noite", hasTimer: false, defaultDurationSeconds: null },
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
