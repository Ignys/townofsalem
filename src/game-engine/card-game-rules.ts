import type { AttackDefenseRule } from "./types";

/**
 * Only interactions stated by the physical-card rules are configured here.
 * Missing pairs deliberately keep the resolution partial for the host.
 */
export const CARD_GAME_ATTACK_DEFENSE_RULES = [
  { attackLevel: "basic", defenseLevel: "none", success: true },
  { attackLevel: "powerful", defenseLevel: "none", success: true },
  { attackLevel: "unstoppable", defenseLevel: "none", success: true },
  { attackLevel: "basic", defenseLevel: "basic", success: false },
  { attackLevel: "powerful", defenseLevel: "basic", success: false },
  { attackLevel: "basic", defenseLevel: "invincible", success: false },
] as const satisfies readonly AttackDefenseRule[];
