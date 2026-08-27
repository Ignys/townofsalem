export interface GameVariants {
  bodyguardCannotGuardSameTargetTwice: boolean;
  doctorCanSelfHealOnce: boolean;
  doctorCannotSaveBodyguardSacrifice: boolean;
  blackmailedCannotVote: boolean;
  sheriffWerewolfDetection: "normal" | "full-moon" | "always";
  werewolfImmuneDuringFullMoon: boolean;
  godfatherDoubleKillWhenLastMafia: boolean;
  survivorLynchBlocksTownNextNight: boolean;
  witchDeathKillsCursedPlayers: boolean;
  jesterWinEndsGame: boolean;
  executionerWinEndsGame: boolean;
}

export const DEFAULT_GAME_VARIANTS: Readonly<GameVariants> = {
  bodyguardCannotGuardSameTargetTwice: false,
  doctorCanSelfHealOnce: false,
  doctorCannotSaveBodyguardSacrifice: true,
  blackmailedCannotVote: false,
  sheriffWerewolfDetection: "normal",
  werewolfImmuneDuringFullMoon: false,
  godfatherDoubleKillWhenLastMafia: false,
  survivorLynchBlocksTownNextNight: false,
  witchDeathKillsCursedPlayers: false,
  jesterWinEndsGame: false,
  executionerWinEndsGame: false,
};

export function withDefaultVariants(
  variants?: Partial<GameVariants>,
): GameVariants {
  return { ...DEFAULT_GAME_VARIANTS, ...variants };
}
