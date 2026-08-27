import { getRoleResourceLimit } from "@/game-engine/role-resource-limits";
import {
  arePlayersAdjacent,
  canUseActionOnNight,
  deputyHasSheriffAbility,
} from "@/game-engine/role-rules";
import { withDefaultVariants, type GameVariants } from "@/game-engine/variants";
import type { HostNightActionEntry, RoleDefinition } from "@/types";

import type { HostActionContext } from "./host-action-entry";
import { getHostActionDefinition } from "./host-action-entry";

export type HostActionValidationSeverity = "error" | "warning";

export interface HostActionValidationIssue {
  code: string;
  severity: HostActionValidationSeverity;
  message: string;
}

export interface HostActionValidationContext extends HostActionContext {
  nightId: string;
  nightNumber?: number;
  actionEntries?: readonly HostNightActionEntry[];
  variants?: Partial<GameVariants>;
}

function error(code: string, message: string): HostActionValidationIssue {
  return { code, severity: "error", message };
}

function warning(code: string, message: string): HostActionValidationIssue {
  return { code, severity: "warning", message };
}

export function validateHostNightAction(
  entry: HostNightActionEntry,
  context: HostActionValidationContext,
  roleDefinitions: readonly RoleDefinition[] = context.roleDefinitions,
): readonly HostActionValidationIssue[] {
  const issues: HostActionValidationIssue[] = [];
  const actor = context.players.find(({ uid }) => uid === entry.actorUid);
  const assignedRoleId = context.assignments[entry.actorUid];
  const action = getHostActionDefinition(entry, roleDefinitions);
  const variants = withDefaultVariants(context.variants);

  if (entry.nightId !== context.nightId) {
    issues.push(error("WRONG_NIGHT", "A ação pertence a outra sessão de noite."));
  }
  if (entry.status === "cancelled") {
    issues.push(error("ACTION_CANCELLED", "A ação está cancelada."));
  }
  if (!actor) issues.push(error("ACTOR_NOT_FOUND", "O ator não existe mais na partida."));
  if (actor?.statuses?.some(({ type }) => type === "town-blocked-next-night")) {
    issues.push(error(
      "TOWN_BLOCKED_BY_SURVIVOR_LYNCH",
      "Esta role da Town está bloqueada nesta noite pela variante do Survivor.",
    ));
  }
  if (!assignedRoleId || assignedRoleId !== entry.roleIdSnapshot) {
    issues.push(error(
      "ROLE_SNAPSHOT_MISMATCH",
      "A role registrada não corresponde à atribuição atual.",
    ));
  }
  if (!action) {
    issues.push(error("ACTION_NOT_FOUND", "A ação não pertence à role registrada."));
    return issues;
  }
  const livingMafiaCount = context.players.filter((player) =>
    player.alive
    && roleDefinitions.find(({ id }) => id === context.assignments[player.uid])?.faction === "mafia"
  ).length;
  const requiredTargetCount = entry.roleIdSnapshot === "godfather"
    && entry.actionId === "mafia-kill-vote"
    && variants.godfatherDoubleKillWhenLastMafia
    && livingMafiaCount === 1
      ? 2
      : action.targetCount;
  if (entry.targetUids.length !== requiredTargetCount) {
    issues.push(error("TARGET_COUNT", `A ação exige ${requiredTargetCount} alvo(s).`));
  }
  if (
    !action.allowDuplicateTargets
    && new Set(entry.targetUids).size !== entry.targetUids.length
  ) {
    issues.push(error("DUPLICATE_TARGET", "A ação não permite alvos duplicados."));
  }

  for (const targetUid of entry.targetUids) {
    const target = context.players.find(({ uid }) => uid === targetUid);
    if (!target) {
      issues.push(error("TARGET_NOT_FOUND", "Um alvo não existe mais na partida."));
      continue;
    }
    const doctorSelfHealAllowed = entry.roleIdSnapshot === "doctor"
      && variants.doctorCanSelfHealOnce;
    if (!action.allowSelfTarget && !doctorSelfHealAllowed && targetUid === entry.actorUid) {
      issues.push(error("SELF_TARGET_FORBIDDEN", "A ação não permite escolher o próprio ator."));
    }
    if (!action.allowDeadTarget && !target.alive) {
      issues.push(error("DEAD_TARGET_FORBIDDEN", "A ação exige um alvo vivo."));
    }
    if (action.requireDeadTarget && target.alive) {
      issues.push(error("LIVING_TARGET_FORBIDDEN", "A ação exige um alvo morto."));
    }
  }

  if (action.verificationStatus === "needs-verification") {
    issues.push(warning(
      "RULE_NEEDS_VERIFICATION",
      "Parte desta ação ainda precisa de confirmação de regra.",
    ));
  }
  if (
    context.nightNumber !== undefined
    && !canUseActionOnNight(action, context.nightNumber)
  ) {
    issues.push(error(
      "ACTION_UNAVAILABLE_THIS_NIGHT",
      `Esta ação não pode ser usada na Night ${context.nightNumber}.`,
    ));
  }

  const resourceLimit = getRoleResourceLimit(
    entry.roleIdSnapshot,
    context.players.length,
  );
  const maxUses = entry.roleIdSnapshot === "janitor"
    ? undefined
    : resourceLimit ?? action.maxUses;
  if (maxUses !== undefined) {
    const previousUses = (context.actionEntries ?? []).filter(
      (other) => other.id !== entry.id
        && other.status === "confirmed"
        && other.actorUid === entry.actorUid
        && other.actionId === entry.actionId,
    ).length;
    if (previousUses >= maxUses) {
      issues.push(error(
        "ACTION_USE_LIMIT_REACHED",
        `Esta ação pode ser usada no máximo ${maxUses} vez${maxUses === 1 ? "" : "es"} por partida.`,
      ));
    }
  }

  if (
    entry.roleIdSnapshot === "doctor"
    && entry.targetUids[0] === entry.actorUid
    && variants.doctorCanSelfHealOnce
  ) {
    const previousSelfHeals = (context.actionEntries ?? []).filter((other) =>
      other.id !== entry.id
      && other.status === "confirmed"
      && other.actorUid === entry.actorUid
      && other.actionId === entry.actionId
      && other.targetUids[0] === entry.actorUid,
    ).length;
    if (previousSelfHeals >= 1) {
      issues.push(error(
        "DOCTOR_SELF_HEAL_ALREADY_USED",
        "O Doctor já usou a única autocura permitida por esta variante.",
      ));
    }
  }

  if (action.targetRelation === "adjacent-pair" && entry.targetUids.length === 2) {
    const [left, right] = entry.targetUids.map((uid) =>
      context.players.find((player) => player.uid === uid),
    );
    if (!left || !right || !arePlayersAdjacent(left, right, context.players)) {
      issues.push(error(
        "TARGETS_NOT_ADJACENT",
        "Os dois alvos precisam ser adjacentes entre os jogadores vivos.",
      ));
    }
  }

  if (entry.roleIdSnapshot === "deputy") {
    const playersWithRoles = context.players.map((player) => ({
      ...player,
      roleId: context.assignments[player.uid],
    }));
    if (!deputyHasSheriffAbility(playersWithRoles)) {
      issues.push(error(
        "SHERIFF_NOT_DEAD",
        "O Deputy só investiga se havia um Sheriff na composição e ele morreu.",
      ));
    }
  }

  if (entry.roleIdSnapshot === "medium") {
    const clue = entry.mediumClue;
    const validClue = clue
      && clue.victimUid === entry.targetUids[0]
      && clue.candidateUids.length === clue.candidateCount
      && new Set(clue.candidateUids).size === clue.candidateUids.length
      && clue.candidateUids.includes(clue.responsiblePlayerUid);
    if (!validClue) {
      issues.push(error(
        "MEDIUM_CLUE_REQUIRED",
        "Escolha 2, 3 ou 4 candidatos e registre uma pista com exatamente um responsável.",
      ));
    }
  }

  if (
    entry.roleIdSnapshot === "bodyguard"
    && variants.bodyguardCannotGuardSameTargetTwice
    && context.nightNumber !== undefined
    && (context.actionEntries ?? []).some((other) =>
      other.id !== entry.id
      && other.status === "confirmed"
      && other.actorUid === entry.actorUid
      && other.nightNumber === context.nightNumber! - 1
      && other.targetUids[0] === entry.targetUids[0],
    )
  ) {
    issues.push(error(
      "BODYGUARD_REPEATED_TARGET",
      "Esta variante impede o Bodyguard de proteger o mesmo alvo em duas noites seguidas.",
    ));
  }

  return issues;
}

export function hasBlockingHostActionIssues(
  issues: readonly HostActionValidationIssue[],
): boolean {
  return issues.some(({ severity }) => severity === "error");
}
