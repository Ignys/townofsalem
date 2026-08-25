export const HOST_NIGHT_ACTION_STATUSES = ["draft", "confirmed", "cancelled"] as const;
export const NIGHT_WAKE_STATUSES = ["pending", "completed", "skipped"] as const;

export type HostNightActionStatus = (typeof HOST_NIGHT_ACTION_STATUSES)[number];
export type NightWakeStatus = (typeof NIGHT_WAKE_STATUSES)[number];

export interface HostNightActionEntry {
  id: string;
  nightId: string;
  actorUid: string;
  roleIdSnapshot: string;
  actionId: string;
  targetUids: readonly string[];
  createdAt: number;
  updatedAt: number;
  status: HostNightActionStatus;
  optionalNotes?: string;
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
