import type { GameVariants } from "@/game-engine/variants";

export const BOOLEAN_GAME_VARIANT_OPTIONS: readonly {
  key: Exclude<keyof GameVariants, "sheriffWerewolfDetection" | "announcementSounds">;
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
  { key: "compositionRespectsCardCount", label: "Composição respeita as cartas", description: "Cada role só entra na composição até o número de cartas do baralho. Desativado, qualquer role pode se repetir, inclusive nos slots aleatórios. Começa ativada por padrão." },
  { key: "randomRolesRespectCardCount", label: "Roles aleatórias respeitam as cartas", description: "Um slot aleatório só sorteia roles com cartas sobrando no baralho. Desativado, os slots podem repetir roles mesmo com a composição respeitando as cartas. Começa ativada por padrão." },
  { key: "amnesiacPicksRole", label: "Amnesiac escolhe a role", description: "Na noite 3, o Amnesiac escolhe a dedo uma das roles possíveis. Desativado, ele recebe uma delas por sorteio." },
  { key: "amnesiacRoleAnnounced", label: "Anunciar a role do Amnesiac", description: "Ao amanhecer, todos ficam sabendo qual role o Amnesiac lembrou, mas não quem ele é." },
  { key: "disableNewRoles", label: "Desativar roles novas do painel", description: "Tira Lookout, Transporter, Retributionist, Disguiser, Framer, Forger e Hypnotist do painel do moderador, dos slots aleatórios e das roles possíveis do Amnesiac. Começa desativada por padrão." },
  { key: "executionerWinEndsGame", label: "Vitória do Executioner encerra", description: "Encerra a partida quando o alvo é enforcado." },
];
