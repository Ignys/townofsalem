export type JoinGameErrorCode =
  | "authentication-failed"
  | "invalid-code"
  | "game-not-found"
  | "game-not-joinable"
  | "invalid-nickname"
  | "invalid-experience"
  | "lookup-failed"
  | "persistence-failed";

export type JoinGameErrorField = "room-code" | "nickname";

export class JoinGameError extends Error {
  readonly code: JoinGameErrorCode;
  readonly originalError?: unknown;

  constructor(code: JoinGameErrorCode, originalError?: unknown) {
    super(code);
    this.name = "JoinGameError";
    this.code = code;
    this.originalError = originalError;
  }
}

export function getJoinGameErrorMessage(error: unknown): string {
  if (!(error instanceof JoinGameError)) {
    return "Não foi possível entrar na partida. Tente novamente.";
  }

  switch (error.code) {
    case "authentication-failed":
      return "Não foi possível preparar seu acesso. Recarregue a página e tente novamente.";
    case "invalid-code":
      return "Informe um código de sala válido com 6 caracteres.";
    case "game-not-found":
      return "Nenhuma partida foi encontrada com esse código.";
    case "game-not-joinable":
      return "Esta partida não aceita novos jogadores.";
    case "invalid-nickname":
      return "Informe um nickname com até 32 caracteres.";
    case "invalid-experience":
      return "Selecione um nível de experiência válido.";
    case "lookup-failed":
      return "Não foi possível localizar a partida. Verifique sua conexão e tente novamente.";
    case "persistence-failed":
      return "Não foi possível entrar na partida. Verifique sua conexão e tente novamente.";
  }
}

export function getJoinGameErrorField(
  error: unknown,
): JoinGameErrorField | undefined {
  if (!(error instanceof JoinGameError)) {
    return undefined;
  }

  if (
    error.code === "invalid-code" ||
    error.code === "game-not-found" ||
    error.code === "game-not-joinable"
  ) {
    return "room-code";
  }

  return error.code === "invalid-nickname" ? "nickname" : undefined;
}

export function shouldResetLocatedGame(error: unknown): boolean {
  return (
    error instanceof JoinGameError &&
    (error.code === "game-not-found" || error.code === "game-not-joinable")
  );
}
