import type { RoleCompositionValidationError } from "./validate-role-composition";

export type RoleAssignmentErrorCode =
  | "not-host"
  | "game-unavailable"
  | "roles-already-assigned"
  | "invalid-composition"
  | "persistence-failed";

export class RoleAssignmentError extends Error {
  readonly code: RoleAssignmentErrorCode;
  readonly validationErrors: readonly RoleCompositionValidationError[];
  readonly originalError?: unknown;

  constructor(
    code: RoleAssignmentErrorCode,
    options?: {
      validationErrors?: readonly RoleCompositionValidationError[];
      originalError?: unknown;
    },
  ) {
    super(`Role assignment failed: ${code}`);
    this.name = "RoleAssignmentError";
    this.code = code;
    this.validationErrors = options?.validationErrors ?? [];
    this.originalError = options?.originalError;
  }
}

export function getRoleAssignmentErrorMessage(error: unknown): string {
  if (!(error instanceof RoleAssignmentError)) {
    return "Não foi possível sortear as roles. Tente novamente.";
  }

  switch (error.code) {
    case "not-host":
      return "Somente o mestre autenticado desta partida pode sortear as roles.";
    case "game-unavailable":
      return "Não foi possível carregar o estado atual da partida.";
    case "roles-already-assigned":
      return "As roles desta partida já foram sorteadas.";
    case "invalid-composition":
      return (
        error.validationErrors[0]?.message ??
        "A composição mudou e não está mais válida. Revise-a antes de sortear."
      );
    case "persistence-failed":
      return "O sorteio não foi salvo. Nenhuma atribuição parcial foi aplicada; tente novamente.";
  }
}
