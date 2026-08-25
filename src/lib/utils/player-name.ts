export const PLAYER_NAME_MAX_LENGTH = 32;

export function normalizePlayerName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidPlayerName(value: string): boolean {
  return value.length > 0 && value.length <= PLAYER_NAME_MAX_LENGTH;
}
