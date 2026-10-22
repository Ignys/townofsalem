import type { EnginePlayer } from "./types";
import type { GameVariants } from "./variants";

// Fora da Town, só estes aparecem como Good; o Politician é a única Town que aparece como Evil.
const SHERIFF_GOOD_NON_TOWN_ROLES = new Set(["godfather", "executioner", "jester", "witch"]);

export function isFullMoonNight(nightNumber: number): boolean {
  return nightNumber >= 2 && nightNumber % 2 === 0;
}

export function getSheriffInvestigationResult(
  target: Pick<EnginePlayer, "roleId" | "faction">,
  nightNumber: number,
  werewolfDetection: GameVariants["sheriffWerewolfDetection"],
): "Good" | "Evil" {
  if (target.roleId === "werewolf") {
    if (werewolfDetection === "always") return "Evil";
    if (werewolfDetection === "full-moon" && isFullMoonNight(nightNumber)) {
      return "Evil";
    }
    return "Good";
  }
  if (target.roleId === "politician") return "Evil";
  return target.faction === "town" || SHERIFF_GOOD_NON_TOWN_ROLES.has(target.roleId) ? "Good" : "Evil";
}

export function getInvestigationResult(
  target: EnginePlayer,
  investigationType: string,
  nightNumber: number,
  variants: GameVariants,
): string | null {
  if (investigationType === "sheriff") {
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
