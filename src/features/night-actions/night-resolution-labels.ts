const STATUS_LABELS: Readonly<Record<string, string>> = {
  ambushed: "com a casa emboscada",
  blackmailed: "chantageado",
  cursed: "amaldiçoado pela Witch",
  "town-blocked-next-night": "impedido de usar uma ação da Cidade na próxima noite",
  "witch-won": "com a condição individual da Witch cumprida",
};

/**
 * Statuses written as `prefix:playerUid`, so the label can name the player the
 * status points at instead of leaking a raw uid to the host.
 */
const REFERENCE_STATUS_LABELS: Readonly<Record<string, (name: string) => string>> = {
  "execution-target": (name) => `marcado como alvo do Executioner de ${name}`,
  "guardian-target": (name) => `sob a proteção do Guardian Angel ${name}`,
  "disguised-as": (name) => `disfarçado com a carta de ${name}`,
};

export function getNightStatusLabel(
  statusType: string,
  playerNames: Readonly<Record<string, string>> = {},
): string {
  const exact = STATUS_LABELS[statusType];
  if (exact) return exact;

  const separator = statusType.indexOf(":");
  if (separator > 0) {
    const describe = REFERENCE_STATUS_LABELS[statusType.slice(0, separator)];
    if (describe) {
      const referencedUid = statusType.slice(separator + 1);
      return describe(playerNames[referencedUid] ?? referencedUid);
    }
  }

  return statusType;
}
