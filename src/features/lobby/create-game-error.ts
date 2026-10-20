export type CreateGameErrorCode =
  | "authentication-failed"
  | "code-generation-exhausted"
  | "invalid-room-name"
  | "persistence-failed";

export class CreateGameError extends Error {
  readonly code: CreateGameErrorCode;
  readonly originalError?: unknown;

  constructor(code: CreateGameErrorCode, originalError?: unknown) {
    super(code);
    this.name = "CreateGameError";
    this.code = code;
    this.originalError = originalError;
  }
}

export function getCreateGameErrorMessage(error: unknown): string {
  if (!(error instanceof CreateGameError)) {
    return "Não foi possível criar a partida. Tente novamente.";
  }

  switch (error.code) {
    case "authentication-failed":
      return "Não foi possível preparar seu acesso. Recarregue a página e tente novamente.";
    case "code-generation-exhausted":
      return "Não foi possível reservar um código de sala. Tente novamente.";
    case "invalid-room-name":
      return "Dê um nome à sala (até 30 caracteres).";
    case "persistence-failed":
      return "Não foi possível salvar a partida. Verifique sua conexão e tente novamente.";
  }
}
