export type RestoreHostSessionErrorCode =
  | "authentication-failed"
  | "invalid-code"
  | "game-not-found"
  | "not-host"
  | "lookup-failed";

export class RestoreHostSessionError extends Error {
  readonly code: RestoreHostSessionErrorCode;
  readonly originalError?: unknown;

  constructor(code: RestoreHostSessionErrorCode, originalError?: unknown) {
    super(code);
    this.name = "RestoreHostSessionError";
    this.code = code;
    this.originalError = originalError;
  }
}

export function getRestoreHostSessionErrorMessage(error: unknown): string {
  if (!(error instanceof RestoreHostSessionError)) {
    return "Não foi possível restaurar o lobby do mestre.";
  }

  switch (error.code) {
    case "authentication-failed":
      return "Não foi possível restaurar seu acesso anônimo.";
    case "invalid-code":
    case "game-not-found":
      return "Esta partida não existe mais.";
    case "not-host":
      return "Este navegador não é o mestre desta partida.";
    case "lookup-failed":
      return "Não foi possível recuperar o lobby. Verifique sua conexão e tente novamente.";
  }
}
