import type { EngineNightAction } from "./types";

interface NightSchedule {
  fromNight?: number;
  onlyNight?: number;
  evenNightsOnly?: boolean;
}

const ACTION_SCHEDULES: Readonly<Record<string, NightSchedule>> = {
  "faction:mafia-attack": { fromNight: 2 },
  "serial-killer:attack": { fromNight: 2 },
  "vigilante:shoot": { fromNight: 2 },
  "werewolf:full-moon-attack": { fromNight: 2, evenNightsOnly: true },
  "executioner:choose-execution-target": { onlyNight: 1 },
  "amnesiac:remember-role": { onlyNight: 3 },
};

export function isEngineActionAvailableOnNight(
  action: Pick<EngineNightAction, "roleId" | "actionId" | "sourceType">,
  nightNumber: number,
): boolean {
  const key = action.sourceType === "faction"
    ? `faction:${action.actionId}`
    : `${action.roleId}:${action.actionId}`;
  const schedule = ACTION_SCHEDULES[key];
  if (!schedule) return true;
  if (schedule.onlyNight !== undefined) return nightNumber === schedule.onlyNight;
  if (schedule.fromNight !== undefined && nightNumber < schedule.fromNight) return false;
  return !schedule.evenNightsOnly || nightNumber % 2 === 0;
}
