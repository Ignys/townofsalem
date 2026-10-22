"use client";

import { Check, ChessQueen, Info, Monitor, Smartphone, type LucideIcon } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate } from "@/lib/firebase/realtime-database-repository";
import { GameSettingsButton } from "@/features/game-variants/game-settings-button";
import { GAME_PACE_LABELS } from "@/features/game-state/hostless-autopilot";
import { PLAYER_NAME_MAX_LENGTH } from "@/lib/utils/player-name";
import { GAME_PACES, type GamePace, type GamePlayMode } from "@/lib/firebase/schema";

const OPTIONS: readonly { mode: GamePlayMode; title: string; description: string; icon: LucideIcon }[] = [
  {
    mode: "hosted",
    title: "Mestre narrador",
    description: "Alguém conduz pelo computador e vê as roles.",
    icon: ChessQueen,
  },
  {
    mode: "hostless",
    title: "Computador na mesa",
    description: "Sem mestre: o computador é só a mesa. Tudo se resolve pelos celulares.",
    icon: Monitor,
  },
  {
    mode: "host-player",
    title: "Só celulares",
    description: "Sem mestre e sem computador: quem criou a sala também joga e guarda os controles de emergência.",
    icon: Smartphone,
  },
];

interface PlayModeSelectorProps {
  gameId: string;
  playMode: GamePlayMode;
  gamePace: GamePace;
  code: string;
  /** Só celulares: quem criou a sala já entrou como jogador. */
  hostJoined: boolean;
  /** Modos que aparecem mas não podem ser escolhidos neste aparelho. */
  unavailableModes?: readonly GamePlayMode[];
  /** Cartas grandes com descrição sempre à vista; usado na aba Sala do celular. */
  large?: boolean;
}

/** Escolha do modo de jogo, só no lobby (a regra do RTDB trava o modo depois do início). */
export function PlayModeSelector({ gameId, playMode, gamePace, code, hostJoined, unavailableModes = [], large = false }: PlayModeSelectorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const save = (field: "playMode" | "gamePace", value: string) => {
    if (saving) return;
    setSaving(true);
    setError(false);
    applyAtomicUpdate({ [firebasePaths.gamePublicField(gameId, field)]: value })
      .catch(() => setError(true))
      .finally(() => setSaving(false));
  };
  const infoRef = useRef<HTMLDialogElement>(null);
  // No celular as cartas só mostram o nome; a explicação fica no botão de informação.
  const shownOptions = OPTIONS.filter(({ mode }) => !large || !unavailableModes.includes(mode) || mode === playMode);
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // O celular que criou a sala entra como jogador com o mesmo uid de mestre.
  const joinAsPlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const { joinGame } = await import("./join-game");
      await joinGame({ code, nickname, experience: "experienced" });
    } catch (error: unknown) {
      const { getJoinGameErrorMessage } = await import("./join-game-error");
      setJoinError(getJoinGameErrorMessage(error));
    } finally {
      setJoining(false);
    }
  };
  const select = (mode: GamePlayMode) => {
    if (mode !== playMode) save("playMode", mode);
  };

  return (
    <section aria-label="Modo de jogo">
      <header className={`flex items-center gap-3 ${large ? "justify-end" : "justify-between"}`}>
        <h2 className={large ? "sr-only" : "whitespace-nowrap font-serif text-lg font-semibold text-[#fffaf0]"}>Modo de jogo</h2>
        {large ? (
          <button
            type="button"
            onClick={() => infoRef.current?.showModal()}
            aria-label="O que cada modo faz"
            className="grid size-10 place-items-center rounded-full border border-white/12 text-[#d3b88c] transition-colors hover:bg-white/5 focus-visible:outline-3 focus-visible:outline-[#d3b88c]"
          >
            <Info aria-hidden="true" className="size-5" />
          </button>
        ) : (
          <GameSettingsButton gameId={gameId} />
        )}
      </header>
      <div role="radiogroup" aria-label="Modo de jogo" className={`grid ${large ? "mt-2 grid-cols-2 items-stretch gap-2.5" : "mt-4 gap-2"}`}>
        {OPTIONS.map(({ mode, title, description, icon: Icon }) => {
          const selected = mode === playMode;
          const unavailable = unavailableModes.includes(mode);
          if (large) {
            // Indisponível some de vez; só aparece se a sala já estiver nesse modo.
            if (unavailable && !selected) return null;
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={saving || unavailable}
                onClick={() => select(mode)}
                className={`relative flex flex-col items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed ${
                  selected
                    ? "border-[#d3b88c]/70 bg-[linear-gradient(160deg,rgba(211,184,140,0.16),rgba(211,184,140,0.03))] shadow-[inset_0_1px_0_rgba(246,223,181,0.12)]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                } ${saving ? "opacity-70" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${selected ? "bg-[#d3b88c] text-[#1b1d20]" : "bg-white/[0.06] text-[#bdb7ad]"}`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="block min-w-0 pr-5 font-serif text-[17px] leading-6 font-semibold text-[#fffaf0]">{title}</span>
                {selected && (
                  <span aria-hidden="true" className="absolute top-3 right-3 grid size-6 place-items-center rounded-full bg-[#d3b88c] text-[#1b1d20]">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          }
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={saving || unavailable}
              onClick={() => select(mode)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-60 ${
                selected ? "border-[#d3b88c]/70 bg-[#d3b88c]/[0.08]" : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid size-8 shrink-0 place-items-center rounded-full ${selected ? "bg-[#d3b88c] text-[#1b1d20]" : "bg-white/[0.06] text-[#bdb7ad]"}`}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[#fffaf0]">{title}</span>
                {selected && <span className="mt-0.5 block text-xs leading-5 text-[#a9a297]">{description}</span>}
                {unavailable && <span className="mt-0.5 block text-xs leading-5 text-[#a9a297]">Precisa de um computador na mesa.</span>}
              </span>
              <span
                aria-hidden="true"
                className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-[#d3b88c]" : "border-white/25"}`}
              >
                {selected && <span className="size-2.5 rounded-full bg-[#d3b88c]" />}
              </span>
            </button>
          );
        })}
      </div>
      {playMode === "host-player" && !hostJoined && (
        <form onSubmit={joinAsPlayer} className="mt-3 grid gap-1.5 border-t border-white/10 pt-3">
          <label htmlFor="host-player-nickname" className="text-xs font-semibold text-[#d7d0c4]">
            Seu nome na partida
          </label>
          <div className="flex gap-2">
            <input
              id="host-player-nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={PLAYER_NAME_MAX_LENGTH}
              required
              autoComplete="nickname"
              className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/15 bg-black/20 px-3 text-sm text-[#fffaf0] outline-none focus:border-[#d3b88c]"
            />
            <button type="submit" disabled={joining} className="btn-primary min-h-10 px-4 text-sm disabled:opacity-60">
              Entrar
            </button>
          </div>
          {joinError && <p role="alert" className="text-xs text-[#f0b9bd]">{joinError}</p>}
        </form>
      )}
      {playMode !== "hosted" && (
        <div className="mt-3 grid gap-1.5 border-t border-white/10 pt-3">
          <h3 className="text-xs font-semibold text-[#d7d0c4]">Ritmo</h3>
          <div role="radiogroup" aria-label="Ritmo" className={`grid grid-cols-3 rounded-full border border-white/10 bg-black/20 ${large ? "p-1" : "p-0.5"}`}>
            {GAME_PACES.map((pace) => {
              const selected = pace === gamePace;
              return (
                <button
                  key={pace}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={saving}
                  onClick={() => {
                    if (!selected) save("gamePace", pace);
                  }}
                  className={`${large ? "min-h-10 text-sm" : "min-h-7"} whitespace-nowrap rounded-full px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-60 ${
                    selected ? "bg-[#d3b88c] text-[#1b1d20]" : "text-[#bdb7ad] hover:text-[#fffaf0]"
                  }`}
                >
                  {GAME_PACE_LABELS[pace].title}
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-4 text-[#a9a297]">{GAME_PACE_LABELS[gamePace].description}</p>
        </div>
      )}
      {large && (
        <dialog
          ref={infoRef}
          aria-labelledby="play-mode-info-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) infoRef.current?.close();
          }}
          className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-3xl border border-[#2e3136] bg-[#1b1d20] p-5 text-[#e5ded2] shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop:bg-black/70"
        >
          <h2 id="play-mode-info-title" className="font-serif text-xl font-semibold text-[#fffaf0]">
            Modos de jogo
          </h2>
          <ul className="mt-4 grid gap-3">
            {shownOptions.map(({ mode, title, description, icon: Icon }) => (
              <li key={mode} className="flex gap-3">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-[#d3b88c]">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-[#fffaf0]">{title}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-[#a9a297]">{description}</span>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => infoRef.current?.close()} className="btn-quiet-dark mt-5 w-full">
            Entendi
          </button>
        </dialog>
      )}
      {large && (
        <div className="mt-4 -mx-2">
          <GameSettingsButton gameId={gameId} variant="row" />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#f0b9bd]">
          Não foi possível mudar o modo de jogo.
        </p>
      )}
    </section>
  );
}
