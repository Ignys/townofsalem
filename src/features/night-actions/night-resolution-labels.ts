const STATUS_LABELS: Readonly<Record<string, string>> = {
  blackmailed: "chantageado",
  cursed: "amaldiçoado pela Witch",
  "town-blocked-next-night": "impedido de usar uma ação da Cidade na próxima noite",
  "witch-won": "com a condição individual da Witch cumprida",
};

export function getNightStatusLabel(statusType: string): string {
  return STATUS_LABELS[statusType] ?? statusType;
}
