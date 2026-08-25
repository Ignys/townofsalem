export interface PlayerEligibilityState {
  alive: boolean;
}

export function isPlayerEligibleToVote(
  player: PlayerEligibilityState,
): boolean {
  return player.alive;
}

export function isPlayerEligibleForNightAction(
  player: PlayerEligibilityState,
): boolean {
  return player.alive;
}
