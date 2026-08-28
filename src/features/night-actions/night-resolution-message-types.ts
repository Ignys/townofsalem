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

export type NightResolutionMessagePart =
  | NightResolutionTextPart
  | NightResolutionPlayerPart
  | NightResolutionRolePart;

export interface NightResolutionMessageLine {
  parts: readonly NightResolutionMessagePart[];
}
