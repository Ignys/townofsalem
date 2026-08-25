export const GAME_EVENT_TYPES = [
  "PLAYER_JOINED",
  "GAME_STARTED",
  "ROLE_ASSIGNED",
  "PHASE_STARTED",
  "PHASE_CHANGED",
  "TIMER_PAUSED",
  "HOST_ACTION_RECORDED",
  "NIGHT_PREVIEW_GENERATED",
  "NIGHT_RESOLUTION_APPLIED",
  "NIGHT_RESOLUTION_ROLLED_BACK",
  "ACTION_SUBMITTED",
  "PLAYER_ROLEBLOCKED",
  "PLAYER_ATTACKED",
  "PLAYER_PROTECTED",
  "PLAYER_DIED",
  "PLAYER_REVIVED_BY_HOST",
  "PLAYER_STATUS_CHANGED",
  "TRIAL_STARTED",
  "PLAYER_EXECUTED",
  "GAME_ENDED",
] as const;

export type GameEventType = (typeof GAME_EVENT_TYPES)[number];

export interface GameEvent<TPayload = unknown> {
  id: string;
  gameId: string;
  type: GameEventType;
  timestamp: number;
  actorUid?: string;
  visibility?: "host-only" | "public";
  payload: TPayload;
}
