export interface NightResolutionTextPart {
  kind: "text";
  text: string;
  tone?: "danger";
}

export interface NightResolutionPlayerPart {
  kind: "player";
  playerUid: string;
  text: string;
  tone?: "danger";
}

export interface NightResolutionRolePart {
  kind: "role";
  roleId: string;
}

/** Etiqueta de facção (ex.: a Máfia como autora de um ataque). */
export interface NightResolutionFactionPart {
  kind: "faction";
  faction: "town" | "mafia" | "neutral";
}

export type NightResolutionMessagePart =
  | NightResolutionTextPart
  | NightResolutionPlayerPart
  | NightResolutionRolePart
  | NightResolutionFactionPart;

export interface NightResolutionMessageLine {
  parts: readonly NightResolutionMessagePart[];
}
