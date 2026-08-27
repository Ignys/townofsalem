import type { EnginePlayer } from "./types";
import type { GameVariants } from "./variants";

const SHERIFF_EVIL_ROLES = new Set([
  "blackmailer",
  "consigliere",
  "janitor",
  "mafioso",
  "serial-killer",
  "politician",
]);

const SHERIFF_KNOWN_GOOD_ROLES = new Set([
  "townie", "doctor", "bodyguard", "sheriff", "deputy", "investigator",
  "mayor", "medium", "veteran", "vigilante", "survivor",
  "peaceful-townie", "spiteful-townie", "godfather", "amnesiac",
  "executioner", "jester", "witch", "werewolf",
]);

export function isFullMoonNight(nightNumber: number): boolean {
  return nightNumber >= 2 && nightNumber % 2 === 0;
}

export function getSheriffInvestigationResult(
  target: Pick<EnginePlayer, "roleId" | "faction">,
  nightNumber: number,
  werewolfDetection: GameVariants["sheriffWerewolfDetection"],
): "Good" | "Evil" {
  if (target.roleId === "godfather") return "Good";
  if (target.roleId === "werewolf") {
    if (werewolfDetection === "always") return "Evil";
    if (werewolfDetection === "full-moon" && isFullMoonNight(nightNumber)) {
      return "Evil";
    }
    return "Good";
  }
  if (SHERIFF_EVIL_ROLES.has(target.roleId)) return "Evil";
  if (target.faction === "mafia") return "Evil";
  return "Good";
}

export function getInvestigationResult(
  target: EnginePlayer,
  investigationType: string,
  nightNumber: number,
  variants: GameVariants,
): string | null {
  if (investigationType === "sheriff") {
    const configured = target.investigativeAppearance?.sheriff;
    if (
      configured
      && !SHERIFF_EVIL_ROLES.has(target.roleId)
      && !SHERIFF_KNOWN_GOOD_ROLES.has(target.roleId)
      && target.faction !== "mafia"
    ) {
      return configured;
    }
    return getSheriffInvestigationResult(
      target,
      nightNumber,
      variants.sheriffWerewolfDetection,
    );
  }
  if (investigationType === "exact-role") {
    return target.investigativeAppearance?.["exact-role"] ?? target.roleId;
  }
  return target.investigativeAppearance?.[investigationType] ?? null;
}
