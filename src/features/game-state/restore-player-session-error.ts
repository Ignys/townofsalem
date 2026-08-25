export type RestorePlayerSessionErrorCode =
  | "authentication-failed"
  | "invalid-code"
  | "game-not-found"
  | "player-removed"
  | "lookup-failed";

export class RestorePlayerSessionError extends Error {
  readonly code: RestorePlayerSessionErrorCode;
  readonly originalError?: unknown;

  constructor(code: RestorePlayerSessionErrorCode, originalError?: unknown) {
    super(code);
    this.name = "RestorePlayerSessionError";
    this.code = code;
    this.originalError = originalError;
  }
}

export function getRestorePlayerSessionErrorMessage(error: unknown): string {
  if (!(error instanceof RestorePlayerSessionError)) {
    return "Não foi possível restaurar sua sessão. Tente novamente.";
  }

  switch (error.code) {
    case "authentication-failed":
      return "Não foi possível restaurar seu acesso anônimo.";
    case "invalid-code":
    case "game-not-found":
      return "Esta partida não existe mais.";
    case "player-removed":
      return "Você não pertence mais a esta partida.";
    case "lookup-failed":
      return "Não foi possível recuperar a partida. Verifique sua conexão e tente novamente.";
  }
}
