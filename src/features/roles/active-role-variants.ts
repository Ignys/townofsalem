import type { GameVariants } from "@/game-engine/variants";

function getSheriffDetectionVariant(
  variants: GameVariants,
  perspective: "sheriff" | "werewolf",
): string | null {
  if (variants.sheriffWerewolfDetection === "full-moon") {
    return perspective === "sheriff"
      ? "Nas noites de lua cheia (noites pares), o Werewolf aparece como Evil. Nas outras noites, ele aparece como Good."
      : "Nas noites de lua cheia (noites pares), você aparece como Evil para o Sheriff. Nas outras noites, aparece como Good.";
  }

  if (variants.sheriffWerewolfDetection === "always") {
    return perspective === "sheriff"
      ? "O Werewolf aparece como Evil em qualquer noite."
      : "Você aparece como Evil para o Sheriff em qualquer noite.";
  }

  return null;
}

export function getActiveRoleVariants(
  roleId: string,
  variants: GameVariants,
): readonly string[] {
  const activeVariants: string[] = [];

  if (roleId === "bodyguard") {
    if (variants.bodyguardCannotGuardSameTargetTwice) {
      activeVariants.push(
        "Você não pode proteger a mesma pessoa em duas noites seguidas.",
      );
    }
    if (variants.doctorCannotSaveBodyguardSacrifice) {
      activeVariants.push(
        "O Doctor não pode impedir sua morte quando você se sacrifica para enfrentar um atacante.",
      );
    }
  }

  if (roleId === "doctor") {
    if (variants.doctorCanSelfHealOnce) {
      activeVariants.push(
        "Uma vez durante a partida, você pode escolher a si mesmo para curar.",
      );
    }
    if (variants.doctorCannotSaveBodyguardSacrifice) {
      activeVariants.push(
        "Sua cura não impede a morte do Bodyguard quando ele se sacrifica para enfrentar um atacante.",
      );
    }
  }

  if (roleId === "sheriff" || roleId === "deputy") {
    const sheriffVariant = getSheriffDetectionVariant(variants, "sheriff");
    if (sheriffVariant) {
      activeVariants.push(
        roleId === "deputy"
          ? `Depois que você assumir a função de Sheriff: ${sheriffVariant}`
          : sheriffVariant,
      );
    }
  }

  if (roleId === "survivor" && variants.survivorLynchBlocksTownNextNight) {
    activeVariants.push(
      "Se você for enforcado, nenhuma role da Town poderá usar sua habilidade na noite seguinte.",
    );
  }

  if (roleId === "blackmailer" && variants.blackmailedCannotVote) {
    activeVariants.push(
      "Além de não poder falar, a pessoa chantageada também não poderá votar no dia seguinte.",
    );
  }

  if (roleId === "godfather" && variants.godfatherDoubleKillWhenLastMafia) {
    activeVariants.push(
      "Quando você for o último membro vivo da Mafia, escolha dois alvos para matar em vez de um.",
    );
  }

  if (roleId === "executioner" && variants.executionerWinEndsGame) {
    activeVariants.push(
      "Quando seu alvo for enforcado, a partida termina imediatamente e somente você vence.",
    );
  }

  if (roleId === "jester" && variants.jesterWinEndsGame) {
    activeVariants.push(
      "Quando você for enforcado, a partida termina imediatamente e somente você vence.",
    );
  }

  if (roleId === "werewolf") {
    if (variants.werewolfImmuneDuringFullMoon) {
      activeVariants.push(
        "Durante as noites de lua cheia (noites pares), você não pode ser morto à noite.",
      );
    }
    const sheriffVariant = getSheriffDetectionVariant(variants, "werewolf");
    if (sheriffVariant) {
      activeVariants.push(sheriffVariant);
    }
  }

  if (roleId === "witch" && variants.witchDeathKillsCursedPlayers) {
    activeVariants.push(
      "Se você morrer, todas as pessoas que você amaldiçoou também morrem.",
    );
  }

  return activeVariants;
}
