import type { HostNightActionEntry, RoleDefinition } from "@/types";

import type { HostActionContext } from "./host-action-entry";
import { getHostActionDefinition } from "./host-action-entry";
import {
  arePlayersAdjacent,
  canUseActionOnNight,
  deputyHasSheriffAbility,
} from "@/game-engine/role-rules";

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

  if (entry.nightId !== context.nightId) {
    issues.push(error("WRONG_NIGHT", "A ação pertence a outra sessão de noite."));
  }
  if (entry.status === "cancelled") {
    issues.push(error("ACTION_CANCELLED", "A ação está cancelada."));
  }
  if (!actor) {
    issues.push(error("ACTOR_NOT_FOUND", "O ator não existe mais na partida."));
  }
  if (!assignedRoleId || assignedRoleId !== entry.roleIdSnapshot) {
    issues.push(error("ROLE_SNAPSHOT_MISMATCH", "A role registrada não corresponde à atribuição atual."));
  }
  if (!action) {
    issues.push(error("ACTION_NOT_FOUND", "A ação não pertence à role registrada."));
    return issues;
  }
  if (entry.targetUids.length !== action.targetCount) {
    issues.push(error("TARGET_COUNT", `A ação exige ${action.targetCount} alvo(s).`));
  }
  if (!action.allowDuplicateTargets && new Set(entry.targetUids).size !== entry.targetUids.length) {
    issues.push(error("DUPLICATE_TARGET", "A ação não permite alvos duplicados."));
  }

  for (const targetUid of entry.targetUids) {
    const target = context.players.find(({ uid }) => uid === targetUid);
    if (!target) {
      issues.push(error("TARGET_NOT_FOUND", "Um alvo não existe mais na partida."));
      continue;
    }
    if (!action.allowSelfTarget && targetUid === entry.actorUid) {
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
    issues.push(warning("RULE_NEEDS_VERIFICATION", "Parte desta ação ainda precisa de confirmação de regra."));
  }

  if (
    context.nightNumber !== undefined &&
    !canUseActionOnNight(action, context.nightNumber)
  ) {
    issues.push(
      error(
        "ACTION_UNAVAILABLE_THIS_NIGHT",
        `Esta ação não pode ser usada na Night ${context.nightNumber}.`,
      ),
    );
  }

  if (action.maxUses !== undefined) {
    const previousUses = (context.actionEntries ?? []).filter(
      (other) =>
        other.id !== entry.id &&
        other.status === "confirmed" &&
        other.actorUid === entry.actorUid &&
        other.actionId === entry.actionId,
    ).length;

    if (previousUses >= action.maxUses) {
      issues.push(
        error(
          "ACTION_USE_LIMIT_REACHED",
          `Esta ação pode ser usada no máximo ${action.maxUses} vez${action.maxUses === 1 ? "" : "es"} por partida.`,
        ),
      );
    }
  }

  if (action.targetRelation === "adjacent-pair" && entry.targetUids.length === 2) {
    const [left, right] = entry.targetUids.map((uid) =>
      context.players.find((player) => player.uid === uid),
    );

    if (!left || !right || !arePlayersAdjacent(left, right, context.players)) {
      issues.push(
        error(
          "TARGETS_NOT_ADJACENT",
          "Os dois alvos precisam ocupar assentos adjacentes na mesa.",
        ),
      );
    }
  }

  if (entry.roleIdSnapshot === "deputy") {
    const playersWithRoles = context.players.map((player) => ({
      ...player,
      roleId: context.assignments[player.uid],
    }));

    if (!deputyHasSheriffAbility(playersWithRoles)) {
      issues.push(
        error(
          "SHERIFF_STILL_ALIVE",
          "O Deputy só investiga depois que o Sheriff morrer.",
        ),
      );
    }
  }

  return issues;
}

export function hasBlockingHostActionIssues(issues: readonly HostActionValidationIssue[]): boolean {
  return issues.some(({ severity }) => severity === "error");
}
