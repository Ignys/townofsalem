"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { useAnonymousAuth } from "@/features/auth";
import type { PlayerExperience } from "@/types";

import { getCreateGameErrorMessage } from "./create-game-error";
import {
  getJoinGameErrorField,
  getJoinGameErrorMessage,
  shouldResetLocatedGame,
  type JoinGameErrorField,
} from "./join-game-error";
import { JoinPlayerFields } from "./join-player-fields";
import type { LocatedGame } from "./join-game";

interface FeedbackMessage {
  kind: "error" | "info";
  text: string;
  field?: JoinGameErrorField;
}

type JoinProgress = "idle" | "locating" | "joining";

interface HomeGameActionsProps {
  initialRoomCode?: string;
}

export function HomeGameActions({
  initialRoomCode = "",
}: HomeGameActionsProps) {
  const router = useRouter();
  const { isLoading, uid, error: authError } = useAnonymousAuth();
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [locatedGame, setLocatedGame] = useState<LocatedGame | null>(null);
  const [nickname, setNickname] = useState("");
  const [experience, setExperience] =
    useState<PlayerExperience>("beginner");
  const [joinProgress, setJoinProgress] = useState<JoinProgress>("idle");
  const creationInProgress = useRef(false);
  const joinInProgress = useRef(false);

  const accessUnavailable =
    isLoading ||
    isCreatingGame ||
    joinProgress !== "idle" ||
    Boolean(authError);
  const roomCodeHasError =
    feedback?.kind === "error" && feedback.field === "room-code";
  const nicknameHasError =
    feedback?.kind === "error" && feedback.field === "nickname";

  const handleCreateGame = async () => {
    if (creationInProgress.current || joinInProgress.current) {
      return;
    }

    creationInProgress.current = true;
    setIsCreatingGame(true);
    setFeedback({ kind: "info", text: "Criando a partida…" });

    try {
      const gameCreation = await import("./create-game");
      const { code } = await gameCreation.createGame();
      router.push(`/host/${code}`);
    } catch (error: unknown) {
      creationInProgress.current = false;
      setIsCreatingGame(false);
      setFeedback({
        kind: "error",
        text: getCreateGameErrorMessage(error),
      });
    }
  };

  const handleJoinGame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (joinInProgress.current || creationInProgress.current) {
      return;
    }

    joinInProgress.current = true;
    setJoinProgress(locatedGame ? "joining" : "locating");
    setFeedback({
      kind: "info",
      text: locatedGame ? "Entrando na partida…" : "Localizando a partida…",
    });

    try {
      const gameJoining = await import("./join-game");

      if (!locatedGame) {
        const game = await gameJoining.locateJoinableGame(roomCode);
        setLocatedGame(game);
        setRoomCode(game.code);
        setFeedback({
          kind: "info",
          text: "Partida encontrada. Complete seus dados para entrar.",
        });
        return;
      }

      const game = await gameJoining.joinGame({
        code: locatedGame.code,
        nickname,
        experience,
      });

      router.push(`/game/${game.code}`);
    } catch (error: unknown) {
      if (shouldResetLocatedGame(error)) {
        setLocatedGame(null);
      }

      setFeedback({
        kind: "error",
        text: getJoinGameErrorMessage(error),
        field: getJoinGameErrorField(error),
      });
    } finally {
      joinInProgress.current = false;
      setJoinProgress("idle");
    }
  };

  const handleRoomCodeChange = (value: string) => {
    setRoomCode(value.toUpperCase());
    setLocatedGame(null);

    if (feedback) {
      setFeedback(null);
    }
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);

    if (feedback?.field === "nickname") {
      setFeedback(null);
    }
  };

  const displayedFeedback = authError
    ? {
        kind: "error" as const,
        text: "Não foi possível preparar seu acesso. Recarregue a página para tentar novamente.",
      }
    : feedback;

  return (
    <section
      aria-labelledby="game-actions-title"
      className="rounded-3xl border border-[#e0cfb4] bg-[#f4ead9] p-5 text-[#251f1d] shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-7"
    >
      <h2 id="game-actions-title" className="sr-only">
        Começar uma partida
      </h2>

      <button
        type="button"
        onClick={handleCreateGame}
        disabled={accessUnavailable}
        aria-busy={isCreatingGame}
        className="min-h-12 w-full rounded-xl bg-[#7d2330] px-5 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(125,35,48,0.2)] transition-colors hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#7d2330] disabled:cursor-not-allowed disabled:bg-[#a79991] disabled:shadow-none"
      >
        {isCreatingGame ? "Criando partida…" : "Criar partida"}
      </button>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[#d8c8b0]" />
        <span className="text-[0.68rem] font-bold tracking-[0.16em] text-[#75685f] uppercase">
          ou entre em uma sala
        </span>
        <span className="h-px flex-1 bg-[#d8c8b0]" />
      </div>

      <form onSubmit={handleJoinGame} noValidate>
        <label
          htmlFor="room-code"
          className="mb-2 block text-sm font-semibold text-[#3b322e]"
        >
          Código da sala
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="room-code"
            name="roomCode"
            type="text"
            value={roomCode}
            onChange={(event) => handleRoomCodeChange(event.target.value)}
            disabled={accessUnavailable}
            autoComplete="off"
            autoCapitalize="characters"
            enterKeyHint="go"
            maxLength={12}
            placeholder="H7K2Q9"
            aria-describedby="room-code-help game-action-feedback"
            aria-invalid={roomCodeHasError}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#b9a994] bg-[#fffaf1] px-4 py-3 font-mono text-base font-semibold tracking-[0.16em] text-[#251f1d] uppercase outline-none placeholder:text-[#a99c8c] focus:border-[#7d2330] focus:ring-3 focus:ring-[#7d2330]/15 disabled:cursor-not-allowed disabled:bg-[#e4d9c8]"
          />
          {!locatedGame && (
            <button
              type="submit"
              disabled={accessUnavailable}
              aria-busy={joinProgress === "locating"}
              className="min-h-12 rounded-xl border border-[#302825] bg-[#302825] px-6 py-3 text-base font-bold text-white transition-colors hover:bg-[#181412] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#7d2330] disabled:cursor-not-allowed disabled:border-[#a79991] disabled:bg-[#a79991] sm:w-auto"
            >
              {joinProgress === "locating" ? "Buscando…" : "Entrar"}
            </button>
          )}
        </div>
        <p id="room-code-help" className="mt-2 text-xs text-[#75685f]">
          Digite o código compartilhado pelo mestre.
        </p>

        {locatedGame && (
          <>
            <JoinPlayerFields
              nickname={nickname}
              experience={experience}
              disabled={accessUnavailable}
              nicknameHasError={nicknameHasError}
              onNicknameChange={handleNicknameChange}
              onExperienceChange={setExperience}
            />
            <button
              type="submit"
              disabled={accessUnavailable}
              aria-busy={joinProgress === "joining"}
              className="mt-5 min-h-12 w-full rounded-xl border border-[#302825] bg-[#302825] px-6 py-3 text-base font-bold text-white transition-colors hover:bg-[#181412] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#7d2330] disabled:cursor-not-allowed disabled:border-[#a79991] disabled:bg-[#a79991]"
            >
              {joinProgress === "joining"
                ? "Entrando…"
                : "Entrar na partida"}
            </button>
          </>
        )}
      </form>

      <div
        id="game-action-feedback"
        role={displayedFeedback?.kind === "error" ? "alert" : "status"}
        aria-live="polite"
        className={`mt-4 min-h-10 rounded-lg px-3 py-2 text-sm leading-5 ${
          displayedFeedback
            ? displayedFeedback.kind === "error"
              ? "bg-[#f8dfe0] text-[#7d2330]"
              : "bg-[#e9dfce] text-[#5b4d44]"
            : "text-transparent"
        }`}
      >
        {displayedFeedback?.text ?? "\u00a0"}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#d8c8b0] pt-4 text-xs font-medium text-[#75685f]">
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${
            isLoading
              ? "bg-[#c18b2f]"
              : authError
                ? "bg-[#a33843]"
                : "bg-[#4f7b5a]"
          }`}
        />
        <span aria-live="polite">
          {isLoading
            ? "Preparando seu acesso…"
            : uid
              ? "Acesso seguro pronto"
              : "Acesso indisponível"}
        </span>
      </div>
    </section>
  );
}
