import type {
  NightResolutionMessageLine,
  NightResolutionMessagePart,
} from "./night-resolution-message-types";

export function getResolutionPlayerName(
  playerUid: string | undefined,
  playerNames: Readonly<Record<string, string>>,
): string {
  return playerUid
    ? playerNames[playerUid] ?? `Jogador ${playerUid}`
    : "Jogador desconhecido";
}

export function resolutionTextPart(
  text: string,
  tone?: "danger",
): NightResolutionMessagePart {
  return { kind: "text", text, ...(tone ? { tone } : {}) };
}

export function resolutionPlayerPart(
  playerUid: string,
  playerNames: Readonly<Record<string, string>>,
  tone?: "danger",
): NightResolutionMessagePart {
  return {
    kind: "player",
    playerUid,
    text: getResolutionPlayerName(playerUid, playerNames),
    ...(tone ? { tone } : {}),
  };
}

export function resolutionTextMessage(text: string): NightResolutionMessageLine {
  return { parts: [resolutionTextPart(text)] };
}
