import type { HostNightActionEntry, Player, RoleDefinition } from "@/types";

import type { EngineGameState, EngineNightAction, EngineWarning } from "./types";
import { resolveMafiaVoteTarget } from "./role-rules";

export interface HostActionAdapterInput {
  gameId: string;
  nightId: string;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  roleDefinitions: readonly RoleDefinition[];
}

export function createEngineGameState(input: HostActionAdapterInput): EngineGameState {
  const rolesById = new Map(input.roleDefinitions.map((role) => [role.id, role]));
  return {
    gameId: input.gameId,
    nightId: input.nightId,
    players: input.players.flatMap((player) => {
      const role = rolesById.get(input.assignments[player.uid] ?? "");
      if (!role) return [];
      return [{
        uid: player.uid,
        name: player.name,
        alive: player.alive,
        roleId: role.id,
        faction: role.faction,
        defense: role.defense === "needs-verification" ? "none" : role.defense,
        statuses: (player.statuses ?? []).map(({ type }) => type),
        investigativeAppearance: role.investigativeAppearance,
      }];
    }),
  };
}

export function adaptHostActions(
  entries: readonly HostNightActionEntry[],
  roleDefinitions: readonly RoleDefinition[],
): { actions: readonly EngineNightAction[]; warnings: readonly EngineWarning[] } {
  const rolesById = new Map(roleDefinitions.map((role) => [role.id, role]));
  const warnings: EngineWarning[] = [];
  const confirmedEntries = entries.filter(({ status }) => status === "confirmed");
  const mafiaVotes = confirmedEntries.filter(
    (entry) => entry.actionId === "mafia-kill-vote" && entry.targetUids[0],
  );
  const regularEntries = confirmedEntries.filter(
    (entry) => entry.actionId !== "mafia-kill-vote",
  );
  const actions: EngineNightAction[] = regularEntries.map((entry) => {
    const role = rolesById.get(entry.roleIdSnapshot);
    const definition = role?.actionDefinitions?.find(({ id }) => id === entry.actionId) ?? (role?.action?.id === entry.actionId ? role.action : undefined);
    if (!definition?.engineEffectType) {
      warnings.push({ code: "UNSUPPORTED_ACTION", actionId: entry.id, message: "A ação ainda não possui efeito modelado." });
    }
    return {
      id: entry.id,
      actorUid: entry.actorUid,
      roleId: entry.roleIdSnapshot,
      actionId: entry.actionId,
      targetUids: [...entry.targetUids],
      effectType: definition?.engineEffectType,
      priority: definition?.priority,
      attackLevel: definition?.engineEffectConfig?.attackLevel,
      protectionLevel: definition?.engineEffectConfig?.protectionLevel,
      investigationType: definition?.engineEffectConfig?.investigationType,
      statusType: definition?.engineEffectConfig?.statusType,
      blockedByTargetStatuses:
        definition?.engineEffectConfig?.blockedByTargetStatuses,
    };
  });

  if (mafiaVotes.length > 0) {
    const votes = Object.fromEntries(
      mafiaVotes.map((entry) => [entry.actorUid, entry.targetUids[0]]),
    );
    const godfather = mafiaVotes.find(
      (entry) => entry.roleIdSnapshot === "godfather",
    );
    const targetUid = resolveMafiaVoteTarget(votes, godfather?.actorUid);

    if (!targetUid) {
      warnings.push({
        code: "MAFIA_VOTE_TIE",
        message:
          "A votação da Mafia empatou sem um voto de Godfather capaz de decidir.",
      });
    } else {
      const actorUid =
        godfather?.actorUid ??
        [...mafiaVotes].sort((left, right) =>
          left.actorUid.localeCompare(right.actorUid),
        )[0].actorUid;
      actions.push({
        id: `mafia-attack:${mafiaVotes.map(({ id }) => id).sort().join("+")}`,
        actorUid,
        roleId: godfather?.roleIdSnapshot ?? "mafioso",
        actionId: "mafia-attack",
        targetUids: [targetUid],
        effectType: "attack",
        priority: 50,
        attackLevel: "basic",
      });
    }
  }

  return { actions, warnings };
}
