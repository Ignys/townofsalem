"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { useAnonymousAuth } from "@/features/auth";

import { getCreateGameErrorMessage } from "./create-game-error";
import {
  getJoinGameErrorField,
  getJoinGameErrorMessage,
  type JoinGameErrorField,
} from "./join-game-error";
import { JoinPlayerFields } from "./join-player-fields";
import type { OpenRoom } from "./open-rooms";

const ROOM_NAME_MAX_LENGTH = 30;
const ROOM_STATUS: Record<NonNullable<OpenRoom["status"]>, { label: string; tone: string }> = {
  lobby: { label: "No lobby", tone: "bg-[#dfe9dc] text-[#3e6647]" },
  "in-progress": { label: "Em jogo", tone: "bg-[#f3dccd] text-[#8a3b1e]" },
  finished: { label: "Encerrada", tone: "bg-[#e6ddd0] text-[#75685f]" },
};

const roomTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

interface FeedbackMessage {
  kind: "error" | "info";
  text: string;
  field?: JoinGameErrorField;
}

type JoinProgress = "idle" | "joining";

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
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [nickname, setNickname] = useState("");
  const [roomName, setRoomName] = useState("");
  const [openRooms, setOpenRooms] = useState<OpenRoom[] | null>(null);
  const [roomsFailed, setRoomsFailed] = useState(false);
  const [joinProgress, setJoinProgress] = useState<JoinProgress>("idle");
  const creationInProgress = useRef(false);
  const joinInProgress = useRef(false);
  const createDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!uid) {
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void import("./open-rooms").then(({ observeOpenRooms }) => {
      if (cancelled) {
        return;
      }

      unsubscribe = observeOpenRooms(
        (rooms) => {
          setRoomsFailed(false);
          setOpenRooms(rooms);
        },
        () => setRoomsFailed(true),
      );
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid]);

  const accessUnavailable =
    isLoading ||
    isCreatingGame ||
    joinProgress !== "idle" ||
    Boolean(authError);
  const roomCodeHasError =
    feedback?.kind === "error" && feedback.field === "room-code";
  const nicknameHasError =
    feedback?.kind === "error" && feedback.field === "nickname";

  const openCreateDialog = () => {
    setCreateError(null);
    createDialog.current?.showModal();
  };

  const handleCreateGame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (creationInProgress.current || joinInProgress.current) {
      return;
    }

    creationInProgress.current = true;
    setIsCreatingGame(true);
    setCreateError(null);

    try {
      const gameCreation = await import("./create-game");
      const { code } = await gameCreation.createGame(roomName);
      router.push(`/host/${code}`);
    } catch (error: unknown) {
      creationInProgress.current = false;
      setIsCreatingGame(false);
      setCreateError(getCreateGameErrorMessage(error));
    }
  };

  const handleJoinGame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (joinInProgress.current || creationInProgress.current) {
      return;
    }

    if (!roomCode) {
      setFeedback({
        kind: "error",
        text: "Escolha uma sala da lista.",
        field: "room-code",
      });
      return;
    }

    joinInProgress.current = true;
    setJoinProgress("joining");
    setFeedback({ kind: "info", text: "Entrando na partida…" });

    try {
      const gameJoining = await import("./join-game");

      const locatedGame = await gameJoining.locateJoinableGame(roomCode);
      const game = await gameJoining.joinGame({
        code: locatedGame.code,
        nickname,
        experience: "beginner",
      });

      router.push(`/game/${game.code}`);
    } catch (error: unknown) {
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
    setRoomCode(value);

    if (feedback?.field === "room-code") {
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
      className="relative rounded-2xl bg-[#f4ead9] p-5 text-[#251f1d] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] max-sm:flex-1 max-sm:rounded-b-none max-sm:rounded-t-[1.75rem] max-sm:px-5 max-sm:pt-7 max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-sm:shadow-[0_-18px_50px_rgba(0,0,0,0.45)] sm:p-7"
    >
      <h2 id="game-actions-title" className="sr-only">
        Entrar em uma sala
      </h2>

      <form onSubmit={handleJoinGame} noValidate>
        <JoinPlayerFields
          nickname={nickname}
          disabled={accessUnavailable}
          nicknameHasError={nicknameHasError}
          onNicknameChange={handleNicknameChange}
        />

        <fieldset aria-describedby="game-action-feedback">
          <legend className="mb-2 block text-sm font-semibold text-[#3b322e] max-sm:font-serif max-sm:text-lg max-sm:text-[#251f1d]">
            Salas abertas
          </legend>
          {openRooms === null || openRooms.length === 0 ? (
            <p className="rounded-xl bg-[#ebdfcb] px-4 py-6 text-center text-sm text-[#75685f]">
              {roomsFailed
                ? "Nenhuma sala encontrada."
                : openRooms === null
                  ? "Procurando salas…"
                  : "Nenhuma sala aberta agora. Peça ao moderador para criar uma."}
            </p>
          ) : (
            <ul
              className={`-mx-1 max-h-72 space-y-2 max-sm:max-h-none overflow-y-auto rounded-xl px-1 py-1 ${
                roomCodeHasError
                  ? "outline-2 outline-offset-2 outline-[#7d2330]"
                  : ""
              }`}
            >
              {openRooms.map((room) => {
                const selected = room.code === roomCode;

                return (
                  <li key={room.code}>
                    <label
                      className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#7d2330] ${
                        selected
                          ? "border-[#7d2330] bg-[#7d2330]/[0.07] shadow-[inset_4px_0_0_#7d2330]"
                          : "border-[#e2d5c1] bg-[#fffaf1] hover:border-[#c9b89f]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="roomCode"
                        value={room.code}
                        checked={selected}
                        onChange={() => handleRoomCodeChange(room.code)}
                        disabled={accessUnavailable}
                        className="sr-only"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-lg leading-tight font-semibold text-[#251f1d]">
                          {room.name}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-[#8a7d72]">
                          <span
                            className={`rounded-full px-2 py-0.5 font-semibold ${ROOM_STATUS[room.status ?? "lobby"].tone}`}
                          >
                            {ROOM_STATUS[room.status ?? "lobby"].label}
                          </span>
                          Criada às {roomTimeFormat.format(room.createdAt)}
                        </span>
                      </span>
                      <span className="shrink-0 text-right leading-none">
                        <span
                          className={`block font-serif text-2xl font-semibold tabular-nums ${
                            selected ? "text-[#7d2330]" : "text-[#3b322e]"
                          }`}
                        >
                          {room.playerCount ?? 0}
                        </span>
                        <span className="mt-1 block text-[0.7rem] text-[#8a7d72]">
                          {room.playerCount === 1 ? "jogador" : "jogadores"}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        {/* Celular: o botão acompanha a rolagem da lista, sempre ao alcance do polegar. */}
        <button
          type="submit"
          disabled={accessUnavailable}
          aria-busy={joinProgress === "joining"}
          className="mt-5 min-h-12 max-sm:sticky max-sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] max-sm:min-h-14 max-sm:shadow-[0_10px_30px_rgba(125,35,48,0.35)] w-full rounded-xl bg-[#7d2330] px-6 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(125,35,48,0.2)] transition-colors hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#7d2330] disabled:cursor-not-allowed disabled:bg-[#a79991] disabled:shadow-none"
        >
          {joinProgress === "joining" ? "Entrando…" : "Entrar na sala"}
        </button>
      </form>

      <div
        id="game-action-feedback"
        role={displayedFeedback?.kind === "error" ? "alert" : "status"}
        aria-live="polite"
        className={`text-sm leading-5 ${
          displayedFeedback
            ? `mt-4 rounded-lg px-3 py-2 ${
                displayedFeedback.kind === "error"
                  ? "bg-[#f8dfe0] text-[#7d2330]"
                  : "bg-[#e9dfce] text-[#5b4d44]"
              }`
            : "sr-only"
        }`}
      >
        {displayedFeedback?.text ?? " "}
      </div>

      <div className="mt-6 border-t border-[#e2d5c1] pt-5 text-center">
        <button
          type="button"
          onClick={openCreateDialog}
          disabled={accessUnavailable}
          className="min-h-11 rounded-lg px-4 text-sm font-semibold text-[#5b4d44] underline decoration-[#c9b89f] underline-offset-4 transition-colors hover:text-[#7d2330] hover:decoration-[#7d2330] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7d2330] disabled:cursor-not-allowed disabled:text-[#a79991]"
        >
          Criar sala
        </button>

        <div className={`mt-2 items-center justify-center gap-2 text-xs font-medium text-[#75685f] ${uid && !authError ? "hidden" : "flex"}`}>
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
      </div>

      <dialog
        ref={createDialog}
        aria-labelledby="create-room-title"
        className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-3xl border border-[#e0cfb4] bg-[#f4ead9] p-6 text-[#251f1d] shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop:bg-black/60"
      >
        <form onSubmit={handleCreateGame} noValidate>
          <h3
            id="create-room-title"
            className="font-serif text-2xl font-semibold tracking-tight"
          >
            Nova sala
          </h3>
          <p className="mt-1 mb-5 text-sm text-[#75685f]">
            Os jogadores vão ver este nome na lista de salas abertas.
          </p>

          <label
            htmlFor="room-name"
            className="mb-2 block text-sm font-semibold text-[#3b322e]"
          >
            Nome da sala
          </label>
          <input
            id="room-name"
            name="roomName"
            type="text"
            value={roomName}
            onChange={(event) => {
              setRoomName(event.target.value);
              setCreateError(null);
            }}
            disabled={isCreatingGame}
            required
            autoFocus
            maxLength={ROOM_NAME_MAX_LENGTH}
            autoComplete="off"
            enterKeyHint="go"
            placeholder="Ex.: Mesa da Ana"
            aria-describedby="create-room-error"
            aria-invalid={Boolean(createError)}
            className="min-h-12 w-full rounded-xl border border-[#b9a994] bg-[#fffaf1] px-4 py-3 text-base text-[#251f1d] outline-none placeholder:text-[#a99c8c] focus:border-[#7d2330] focus:ring-3 focus:ring-[#7d2330]/15 disabled:cursor-not-allowed disabled:bg-[#e4d9c8]"
          />
          <p
            id="create-room-error"
            role="alert"
            className="mt-2 min-h-5 text-sm text-[#7d2330]"
          >
            {createError}
          </p>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => createDialog.current?.close()}
              disabled={isCreatingGame}
              className="min-h-12 flex-1 rounded-xl border border-[#b9a994] px-4 py-3 text-base font-semibold text-[#3b322e] hover:bg-[#e9dfce] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#7d2330] disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreatingGame}
              aria-busy={isCreatingGame}
              className="min-h-12 flex-[2] rounded-xl bg-[#7d2330] px-4 py-3 text-base font-bold text-white hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#7d2330] disabled:cursor-not-allowed disabled:bg-[#a79991]"
            >
              {isCreatingGame ? "Criando sala…" : "Criar sala"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
