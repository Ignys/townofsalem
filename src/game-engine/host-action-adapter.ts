import type { HostNightActionEntry, Player, RoleDefinition } from "@/types";

import type { EngineGameState, EngineNightAction, EngineWarning } from "./types";
import { resolveMafiaVoteTarget } from "./role-rules";
import type { PrivatePlayerRecord } from "@/lib/firebase/schema";

export interface HostActionAdapterInput {
  gameId: string;
  nightId: string;
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  roleDefinitions: readonly RoleDefinition[];
  nightNumber?: number;
  variants?: EngineGameState["variants"];
  privatePlayerStates?: Readonly<Record<string, PrivatePlayerRecord>>;
  amnesiacRolePool?: readonly string[];
}

export function createEngineGameState(input: HostActionAdapterInput): EngineGameState {
  const rolesById = new Map(input.roleDefinitions.map((role) => [role.id, role]));
  const resourceUses: Record<string, number> = {};
  for (const [playerUid, state] of Object.entries(input.privatePlayerStates ?? {})) {
    for (const [resource, uses] of Object.entries(state.resourceUses ?? {})) {
      resourceUses[`${playerUid}:${resource}`] = uses;
    }
  }
  return {
    gameId: input.gameId,
    nightId: input.nightId,
    nightNumber: input.nightNumber,
    variants: input.variants,
    amnesiacRolePool: input.amnesiacRolePool,
    resourceUses,
    players: input.players.flatMap((player) => {
      const role = rolesById.get(input.assignments[player.uid] ?? "");
      if (!role) return [];
      return [{
        uid: player.uid,
        name: player.name,
        alive: player.alive,
        roleId: role.id,
        faction: role.faction,
        canDieAtNight: role.canDieAtNight,
        statuses: Object.keys(input.privatePlayerStates?.[player.uid]?.statuses ?? {})
          .concat((player.statuses ?? []).map(({ type }) => type))
          .filter((status, index, statuses) => statuses.indexOf(status) === index),
        seat: player.seat,
        originalRoleId: input.privatePlayerStates?.[player.uid]?.originalRoleId ?? role.id,
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
      ...(definition?.engineEffectType ? { effectType: definition.engineEffectType } : {}),
      ...(definition?.priority !== undefined ? { priority: definition.priority } : {}),
      ...(definition?.engineEffectConfig?.investigationType
        ? { investigationType: definition.engineEffectConfig.investigationType }
        : {}),
      ...(definition?.engineEffectConfig?.statusType
        ? { statusType: definition.engineEffectConfig.statusType }
        : {}),
      ...(definition?.engineEffectConfig?.blockedByTargetStatuses
        ? { blockedByTargetStatuses: definition.engineEffectConfig.blockedByTargetStatuses }
        : {}),
      ...(definition?.engineEffectConfig?.protectionType
        ? { protectionType: definition.engineEffectConfig.protectionType }
        : {}),
      ...(definition?.engineEffectConfig?.attacksVisitors
        ? { attacksVisitors: definition.engineEffectConfig.attacksVisitors }
        : {}),
      ...(definition?.engineEffectConfig?.countsAsVisit !== undefined
        ? { countsAsVisit: definition.engineEffectConfig.countsAsVisit }
        : {}),
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
      const targetUids = mafiaVotes.length === 1 && mafiaVotes[0].targetUids.length > 1
        ? [...new Set(mafiaVotes[0].targetUids)]
        : [targetUid];
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
        targetUids,
        effectType: "attack",
        priority: 50,
        sourceType: "faction",
        sourceFaction: "mafia",
        participantUids: mafiaVotes.map(({ actorUid: uid }) => uid).sort(),
      });
      const janitorVote = mafiaVotes.find(
        (entry) => entry.roleIdSnapshot === "janitor",
      );
      if (janitorVote) {
        actions.push({
          id: `janitor-auto-clean:${janitorVote.id}`,
          actorUid: janitorVote.actorUid,
          roleId: "janitor",
          actionId: "clean",
          targetUids: [],
          effectType: "clean",
          priority: 60,
          countsAsVisit: false,
        });
      }
    }
  }

  return { actions, warnings };
}
