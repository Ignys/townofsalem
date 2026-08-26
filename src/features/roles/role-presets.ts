import type { Faction } from "@/types";

export interface RoleCompositionPreset {
  id: string;
  label: string;
  playerCount: number;
  factionCounts: Readonly<Record<Faction, number>>;
  roleIds: readonly string[];
}

export const ROLE_COMPOSITION_PRESETS: readonly RoleCompositionPreset[] = [
  {
    id: "balanced-ten-players",
    label: "10 jogadores (6:3:1)",
    playerCount: 10,
    factionCounts: { town: 6, mafia: 3, neutral: 1 },
    roleIds: [
      "bodyguard",
      "doctor",
      "deputy",
      "investigator",
      "mayor",
      "medium",
      "blackmailer",
      "godfather",
      "janitor",
      "executioner",
    ],
  },
  {
    id: "balanced-twelve-players",
    label: "12 jogadores (7:3:2)",
    playerCount: 12,
    factionCounts: { town: 7, mafia: 3, neutral: 2 },
    roleIds: [
      "bodyguard",
      "doctor",
      "deputy",
      "investigator",
      "mayor",
      "medium",
      "peaceful-townie",
      "blackmailer",
      "consigliere",
      "godfather",
      "amnesiac",
      "jester",
    ],
  },
  {
    id: "balanced-fifteen-players",
    label: "15 jogadores (9:4:2)",
    playerCount: 15,
    factionCounts: { town: 9, mafia: 4, neutral: 2 },
    roleIds: [
      "bodyguard",
      "doctor",
      "deputy",
      "investigator",
      "mayor",
      "medium",
      "peaceful-townie",
      "survivor",
      "survivor",
      "blackmailer",
      "consigliere",
      "godfather",
      "janitor",
      "amnesiac",
      "jester",
    ],
  },
];
