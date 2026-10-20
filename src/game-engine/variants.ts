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
  /** Onde tocam os sons de anúncio (noite e julgamento). */
  announcementSounds: "players" | "host" | "both";
  /** Desativado, a composição pode ter mais cópias de uma role do que há cartas no baralho. */
  compositionRespectsCardCount: boolean;
  /** Slots aleatórios não usam mais cópias de uma role do que há cartas no baralho. */
  randomRolesRespectCardCount: boolean;
  /** O Amnesiac escolhe a role da lista na noite 3, em vez de receber uma por sorteio. */
  amnesiacPicksRole: boolean;
  /** Anuncia a todos qual role o Amnesiac lembrou, sem dizer quem ele é. */
  amnesiacRoleAnnounced: boolean;
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
  announcementSounds: "both",
  compositionRespectsCardCount: true,
  randomRolesRespectCardCount: true,
  amnesiacPicksRole: false,
  amnesiacRoleAnnounced: false,
};

export function withDefaultVariants(
  variants?: Partial<GameVariants>,
): GameVariants {
  return { ...DEFAULT_GAME_VARIANTS, ...variants };
}
