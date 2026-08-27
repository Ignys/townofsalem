import type { Faction } from "@/types";

import type { EngineGameState, EngineNightAction, EnginePlayer } from "./types";

export function enginePlayer(
  uid: string,
  roleId: string,
  faction: Faction = "town",
  overrides: Partial<EnginePlayer> = {},
): EnginePlayer {
  return {
    uid,
    name: uid,
    alive: true,
    roleId,
    faction,
    canDieAtNight: !["serial-killer", "survivor"].includes(roleId),
    statuses: [],
    ...overrides,
  };
}

export function engineGame(
  players: readonly EnginePlayer[],
  overrides: Partial<EngineGameState> = {},
): EngineGameState {
  return {
    gameId: "game",
    nightId: "night-2",
    nightNumber: 2,
    players,
    ...overrides,
  };
}

export function engineAction(
  id: string,
  actorUid: string,
  roleId: string,
  actionId: string,
  targetUids: readonly string[],
  overrides: Partial<EngineNightAction> = {},
): EngineNightAction {
  return {
    id,
    actorUid,
    roleId,
    actionId,
    targetUids,
    priority: 50,
    effectType: "attack",
    ...overrides,
  };
}
