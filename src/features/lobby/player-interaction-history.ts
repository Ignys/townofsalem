import type {
  HostNightActionEntry,
  RoleActionDefinition,
  RoleDefinition,
} from "@/types";

export interface PlayerInteractionHistoryItem {
  id: string;
  description: string;
  notes?: string;
  status: HostNightActionEntry["status"];
}

export interface PlayerInteractionHistoryGroup {
  nightId: string;
  nightNumber?: number;
  interactions: readonly PlayerInteractionHistoryItem[];
}

interface PlayerInteractionHistoryOptions {
  actionEntries: readonly HostNightActionEntry[];
  playerUid: string;
  playerNames: Readonly<Record<string, string>>;
  nightNumberById: Readonly<Record<string, number>>;
  roleDefinitions: readonly RoleDefinition[];
}

const PAST_TENSE_BY_VERB: Readonly<Record<string, string>> = {
  "amaldiçoa": "Amaldiçoou",
  "ataca": "Atacou",
  "ataca os jogadores adjacentes": "Atacou os jogadores adjacentes",
  "consulta": "Consultou",
  "cura": "Curou",
  "descobre a role de": "Descobriu a role de",
  "entra em Alert": "Entrou em Alert",
  "investiga": "Investigou",
  "lembra a role de": "Lembrou a role de",
  "manda atacar": "Mandou atacar",
  "marca como alvo": "Marcou como alvo",
  "protege": "Protegeu",
  "silencia": "Silenciou",
  "atira em": "Atirou em",
};

function joinTargetNames(targetNames: readonly string[]): string {
  if (targetNames.length <= 1) return targetNames[0] ?? "";
  return `${targetNames.slice(0, -1).join(", ")} e ${targetNames.at(-1)}`;
}

function findActionDefinition(
  entry: HostNightActionEntry,
  roleDefinitions: readonly RoleDefinition[],
): RoleActionDefinition | undefined {
  const role = roleDefinitions.find(({ id }) => id === entry.roleIdSnapshot);
  return role?.actionDefinitions?.find(({ id }) => id === entry.actionId)
    ?? (role?.action?.id === entry.actionId ? role.action : undefined);
}

function formatInteractionDescription(
  entry: HostNightActionEntry,
  playerNames: Readonly<Record<string, string>>,
  roleDefinitions: readonly RoleDefinition[],
): string {
  const action = findActionDefinition(entry, roleDefinitions);
  if (!action) return "Registrou uma ação.";

  if (entry.actionId === "remember-role" && entry.targetUids.length === 0) {
    return "Lembrou uma role.";
  }

  const pastTense = PAST_TENSE_BY_VERB[action.verb] ?? `Registrou: ${action.label}`;
  const targetNames = entry.targetUids
    .filter(Boolean)
    .map((targetUid) => playerNames[targetUid] ?? "Jogador removido");
  const missingTargetCount = Math.max(0, action.targetCount - targetNames.length);
  const displayedTargets = [
    ...targetNames,
    ...Array.from({ length: missingTargetCount }, () => "alvo pendente"),
  ];
  const targets = joinTargetNames(displayedTargets);

  return `${pastTense}${targets ? ` ${targets}` : ""}.`;
}

export function getPlayerInteractionHistory({
  actionEntries,
  playerUid,
  playerNames,
  nightNumberById,
  roleDefinitions,
}: PlayerInteractionHistoryOptions): readonly PlayerInteractionHistoryGroup[] {
  const groups = new Map<
    string,
    { nightNumber?: number; entries: HostNightActionEntry[] }
  >();

  actionEntries
    .filter(({ actorUid, status }) => actorUid === playerUid && status !== "cancelled")
    .forEach((entry) => {
      const group = groups.get(entry.nightId) ?? {
        nightNumber: entry.nightNumber ?? nightNumberById[entry.nightId],
        entries: [],
      };
      group.entries.push(entry);
      groups.set(entry.nightId, group);
    });

  return [...groups.entries()]
    .map(([nightId, group]) => ({
      nightId,
      nightNumber: group.nightNumber,
      interactions: group.entries
        .sort((left, right) => left.createdAt - right.createdAt)
        .map((entry) => ({
          id: entry.id,
          description: formatInteractionDescription(
            entry,
            playerNames,
            roleDefinitions,
          ),
          notes: entry.optionalNotes,
          status: entry.status,
        })),
    }))
    .sort((left, right) => {
      if (left.nightNumber !== undefined && right.nightNumber !== undefined) {
        return left.nightNumber - right.nightNumber;
      }
      if (left.nightNumber !== undefined) return -1;
      if (right.nightNumber !== undefined) return 1;
      return left.nightId.localeCompare(right.nightId);
    });
}
