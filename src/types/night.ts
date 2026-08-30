export const HOST_NIGHT_ACTION_STATUSES = ["draft", "confirmed", "cancelled"] as const;
export const NIGHT_WAKE_STATUSES = ["pending", "completed", "skipped"] as const;

export const HOST_NIGHT_ACTION_SOURCES = ["host", "player"] as const;

export type HostNightActionStatus = (typeof HOST_NIGHT_ACTION_STATUSES)[number];
export type HostNightActionSource = (typeof HOST_NIGHT_ACTION_SOURCES)[number];
export type NightWakeStatus = (typeof NIGHT_WAKE_STATUSES)[number];

export interface HostNightActionEntry {
  id: string;
  nightId: string;
  nightNumber?: number;
  actorUid: string;
  roleIdSnapshot: string;
  actionId: string;
  targetUids: readonly string[];
  createdAt: number;
  updatedAt: number;
  status: HostNightActionStatus;
  optionalNotes?: string;
  /** Onde a entrada nasceu. Ausente equivale a "host" (entradas anteriores a submissões de jogador). */
  source?: HostNightActionSource;
  /** `updatedAt` da submissão do jogador que gerou esta entrada, para espelhamento idempotente. */
  sourceUpdatedAt?: number;
  /** Momento em que o mestre sobrescreveu uma entrada enviada pelo jogador. */
  overriddenAt?: number;
}

/** Submissão feita pelo próprio jogador em `playerNightActions/{nightId}/{uid}/{actionId}`. */
export interface PlayerNightActionSubmission {
  nightId: string;
  nightNumber?: number;
  actionId: string;
  roleIdSnapshot: string;
  targetUids: readonly string[];
  createdAt: number;
  updatedAt: number;
}

export interface HostNightNote {
  id: string;
  nightId: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface WakeChecklistState {
  itemId: string;
  status: NightWakeStatus;
  updatedAt: number;
}
