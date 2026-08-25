export interface RoleCompositionPreset {
  id: string;
  label: string;
  kind: "validated" | "experimental" | "custom";
  roleIds: readonly string[];
}

export const ROLE_COMPOSITION_PRESETS: readonly RoleCompositionPreset[] = [
  {
    id: "balanced-nine-players",
    label: "Balanceada (9 jogadores, Virtue 0)",
    kind: "validated",
    roleIds: [
      "bodyguard",
      "doctor",
      "deputy",
      "investigator",
      "mayor",
      "peaceful-townie",
      "blackmailer",
      "godfather",
      "serial-killer",
    ],
  },
];
