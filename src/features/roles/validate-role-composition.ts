import { getRoleById, isValidRoleId } from "@/data/roles";

import {
  ROLE_COMPOSITION_RULES,
  type RoleCompositionRules,
} from "./role-composition-rules";

export type RoleCompositionValidationError =
  | {
      code: "empty-composition";
      message: string;
    }
  | {
      code: "player-count-mismatch";
      message: string;
      expectedPlayerCount: number;
      actualRoleCount: number;
    }
  | {
      code: "invalid-role-id";
      message: string;
      roleId: string;
    }
  | {
      code: "duplicate-role-not-allowed";
      message: string;
      roleId: string;
      occurrences: number;
    }
  | {
      code: "card-count-exceeded";
      message: string;
      roleId: string;
      occurrences: number;
      cardCount: number;
    };

export interface RoleCompositionValidationResult {
  valid: boolean;
  errors: readonly RoleCompositionValidationError[];
}

export interface ValidateRoleCompositionInput {
  roleIds: readonly string[];
  playerCount: number;
  rules?: RoleCompositionRules;
}

function countRoleIds(roleIds: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();

  roleIds.forEach((roleId) => {
    counts.set(roleId, (counts.get(roleId) ?? 0) + 1);
  });

  return counts;
}

export function validateRoleComposition({
  roleIds,
  playerCount,
  rules = ROLE_COMPOSITION_RULES,
}: ValidateRoleCompositionInput): RoleCompositionValidationResult {
  const errors: RoleCompositionValidationError[] = [];

  if (roleIds.length === 0) {
    errors.push({
      code: "empty-composition",
      message: "Adicione ao menos uma role à composição.",
    });
  }

  if (roleIds.length !== playerCount) {
    errors.push({
      code: "player-count-mismatch",
      message: `Selecione ${playerCount} role${playerCount === 1 ? "" : "s"} para os ${playerCount} jogador${playerCount === 1 ? "" : "es"} conectado${playerCount === 1 ? "" : "s"}.`,
      expectedPlayerCount: playerCount,
      actualRoleCount: roleIds.length,
    });
  }

  const counts = countRoleIds(roleIds);

  counts.forEach((occurrences, roleId) => {
    if (!isValidRoleId(roleId)) {
      errors.push({
        code: "invalid-role-id",
        message: `A role “${roleId}” não existe no catálogo.`,
        roleId,
      });
      return;
    }

    if (!rules.allowDuplicateRoleIds && occurrences > 1) {
      const role = getRoleById(roleId);
      errors.push({
        code: "duplicate-role-not-allowed",
        message: `${role?.name ?? roleId} não pode aparecer mais de uma vez.`,
        roleId,
        occurrences,
      });
      return;
    }

    const role = getRoleById(roleId);
    if (rules.enforceCardCounts !== false && role && occurrences > role.cardCount) {
      errors.push({
        code: "card-count-exceeded",
        message: `${role.name} possui apenas ${role.cardCount} carta${role.cardCount === 1 ? "" : "s"} no baralho.`,
        roleId,
        occurrences,
        cardCount: role.cardCount,
      });
    }
  });

  return { valid: errors.length === 0, errors };
}
