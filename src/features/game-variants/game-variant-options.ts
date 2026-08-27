import type { GameVariants } from "@/game-engine/variants";

export const BOOLEAN_GAME_VARIANT_OPTIONS: readonly {
  key: Exclude<keyof GameVariants, "sheriffWerewolfDetection">;
  label: string;
  description: string;
}[] = [
  { key: "bodyguardCannotGuardSameTargetTwice", label: "Bodyguard não repete alvo em noites seguidas", description: "Impede proteger a mesma pessoa em duas noites consecutivas; depois de uma noite com outro alvo, ela pode ser protegida novamente." },
  { key: "doctorCanSelfHealOnce", label: "Doctor pode se curar uma vez", description: "Libera uma única autocura durante a partida." },
  { key: "doctorCannotSaveBodyguardSacrifice", label: "Doctor não salva o sacrifício", description: "Quando ativa, a cura não impede a morte especial do Bodyguard. Começa ativada por padrão." },
  { key: "blackmailedCannotVote", label: "Blackmailed não pode votar", description: "Além de não falar, a vítima perde o voto no dia seguinte." },
  { key: "werewolfImmuneDuringFullMoon", label: "Werewolf imune na lua cheia", description: "Concede imunidade noturna nas noites pares." },
  { key: "godfatherDoubleKillWhenLastMafia", label: "Godfather faz ataque duplo", description: "Quando é o último Mafia vivo, permite a variante de ataque duplo." },
  { key: "survivorLynchBlocksTownNextNight", label: "Lynch do Survivor bloqueia Town", description: "Aplica a penalidade variante à Town na noite seguinte." },
  { key: "witchDeathKillsCursedPlayers", label: "Morte da Witch mata cursed", description: "Ativa a consequência variante ao morrer." },
  { key: "jesterWinEndsGame", label: "Vitória do Jester encerra", description: "Encerra a partida quando o Jester cumpre seu objetivo." },
  { key: "executionerWinEndsGame", label: "Vitória do Executioner encerra", description: "Encerra a partida quando o alvo é enforcado." },
];
