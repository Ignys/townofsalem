import { BookOpen, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { firebasePaths } from "@/lib/firebase/paths";
import type {
  GamePublicRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";
import { getConnectedPlayerEntries } from "@/features/game-state/player-roster";

import type { FirebaseConnectionStatus } from "./use-firebase-connection";
import { RolesGuideButton } from "@/features/roles/roles-guide-button";
import { RoomShareCard } from "./room-share-card";
import { PlayerLobbyRolesTab } from "@/features/roles/player-lobby-roles-tab";

interface RealtimeLobbyViewProps {
  code: string;
  /** Com ele, quem espera vê as roles que o mestre está montando. */
  gameId?: string;
  viewer: "host" | "player";
  viewerUid?: string;
  game: GamePublicRecord;
  players: Record<string, PublicPlayerRecord>;
  connectionStatus: FirebaseConnectionStatus;
  updating: boolean;
}

const connectionLabels: Record<FirebaseConnectionStatus, string> = {
  connecting: "Conectando…",
  connected: "Conectado",
  reconnecting: "Reconectando…",
  unavailable: "Conexão indisponível",
};

/** Nome que o moderador deu à sala; salas antigas não têm e caem no código. */
export function useRoomName(code: string): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([import("firebase/database"), import("@/lib/firebase/references")])
      .then(([{ get }, { getDatabaseReference }]) =>
        get(getDatabaseReference(firebasePaths.openRoom(code))),
      )
      .then((snapshot) => {
        const value = snapshot.val() as { name?: string } | null;
        if (active) setName(value?.name ?? null);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [code]);

  return name;
}

function PlayerLobbyTabs({ tab, onChange }: Readonly<{ tab: "table" | "roles"; onChange: (tab: "table" | "roles") => void }>) {
  const tabs = [
    { id: "table", label: "Mesa", icon: Users },
    { id: "roles", label: "Roles", icon: BookOpen },
  ] as const;
  return (
    <nav aria-label="Seções do lobby" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#2e3136] bg-[#16181b]/97 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = id === tab;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  onChange(id);
                  window.scrollTo({ top: 0 });
                }}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 w-full flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-[#d3b88c] ${active ? "text-[#f6dfb5]" : "text-[#8d877e]"}`}
              >
                {active && <span aria-hidden="true" className="absolute inset-x-10 top-0 h-0.5 rounded-full bg-[#c18b2f] shadow-[0_0_12px_#c18b2f]" />}
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function RealtimeLobbyView({
  code,
  gameId,
  viewer,
  viewerUid,
  game,
  players,
  connectionStatus,
  updating,
}: RealtimeLobbyViewProps) {
  const roomName = useRoomName(code);
  const connectedPlayers = getConnectedPlayerEntries(players);
  const gameFinished = game.status === "finished" || game.phase === "game-over";
  const gameInProgress = game.status === "in-progress";
  const lobbyStatus = gameFinished
    ? "Esta partida já terminou."
    : gameInProgress
      ? "A partida está em andamento."
      : viewer === "host"
        ? "Aguardando jogadores."
        : "Jogadores";
  const configuring = viewer === "player" && !gameFinished && !gameInProgress;
  const [tab, setTab] = useState<"table" | "roles">("table");

  // Lobby do jogador: duas abas no rodapé, Mesa e a biblioteca de roles.
  if (configuring && gameId && tab === "roles") {
    return (
      <section className="w-full max-w-md pb-24">
        <PlayerLobbyRolesTab gameId={gameId} playerCount={connectedPlayers.length} />
        <PlayerLobbyTabs tab={tab} onChange={setTab} />
      </section>
    );
  }

  const connectionDot =
    connectionStatus === "connected" ? "bg-[#6f9b77]" : connectionStatus === "unavailable" ? "bg-[#a33843]" : "bg-[#c18b2f]";

  // Mesa do jogador: a sala no alto e cada jogador como um assento no pergaminho.
  if (configuring && gameId) {
    return (
      <section className="w-full max-w-md pb-24">
        <header className="pt-2 text-center">
          <h1 className="font-serif text-[2.5rem] leading-tight font-semibold tracking-tight text-[#fffaf0]">
            {roomName ?? <span className="sr-only">Sala </span>}
            {roomName ? null : code}
          </h1>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-xs text-[#a9a297]">
            {roomName && <span className="font-semibold tracking-[0.14em] text-[#d3b88c]">{code}</span>}
            {roomName && <span aria-hidden="true" className="h-3 w-px bg-white/15" />}
            <span aria-hidden="true" className={`size-1.5 rounded-full ${connectionDot}`} />
            <span aria-live="polite">
              {connectionLabels[connectionStatus]}
              {updating ? ", atualizando…" : ""}
            </span>
          </p>
        </header>

        <div className="mt-7 rounded-3xl border border-[#e0cfb4] bg-[#f4ead9] px-4 pt-5 pb-4 text-[#251f1d] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <h2 className="flex items-baseline justify-between gap-3 px-1">
            <span className="font-serif text-xl font-semibold">Na mesa</span>
            <span className="text-sm text-[#75685f]">
              <span className="font-serif text-2xl font-semibold text-[#7d2330] tabular-nums">{connectedPlayers.length}</span>{" "}
              {connectedPlayers.length === 1 ? "jogador" : "jogadores"}
            </span>
          </h2>

          {connectedPlayers.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-2" aria-live="polite">
              {connectedPlayers.map(([uid, player], index) => {
                const isViewer = uid === viewerUid;
                return (
                  <li
                    key={uid}
                    className={`flex min-h-14 items-center gap-2.5 rounded-2xl border px-2.5 ${
                      isViewer ? "border-[#7d2330] bg-[#7d2330] text-[#fffaf0] shadow-[0_8px_20px_rgba(125,35,48,0.3)]" : "border-[#e2d5c1] bg-[#fffaf1]"
                    }`}
                  >
                    <span
                      aria-label={`Casa ${player.seat ?? index + 1}`}
                      className={`grid size-8 shrink-0 place-items-center rounded-full font-serif text-base font-semibold tabular-nums ${
                        isViewer ? "bg-[#fffaf0]/15 text-[#fffaf0]" : "bg-[#ebdfcb] text-[#5b4d44]"
                      }`}
                    >
                      {player.seat ?? index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm leading-5 font-semibold">{player.name}</span>
                      {isViewer && <span className="block text-[11px] leading-4 text-[#f6dfb5]">Você</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-[#cdbb9f] px-4 py-6 text-center text-sm text-[#75685f]">Ninguém sentou ainda.</p>
          )}
        </div>

        <PlayerLobbyTabs tab={tab} onChange={setTab} />
      </section>
    );
  }

  return (
    <section className="w-full max-w-md">
      <header className="mb-6 text-center">
        {roomName ? (
          <h1 className="font-mono text-xl font-semibold tracking-[0.14em] text-[#f6dfb5] uppercase">
            {roomName}
          </h1>
        ) : (
          <h1 className="font-mono text-xl font-semibold tracking-[0.14em] text-[#f6dfb5]">
            <span className="sr-only">Sala </span>
            {code}
          </h1>
        )}
      </header>

      {viewer === "host" && <RoomShareCard code={code} />}

      <div className="rounded-2xl border border-[#e0cfb4] bg-[#f4ead9] p-5 text-[#251f1d] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-serif text-base font-semibold">
            {lobbyStatus}
          </h2>
          <span className="rounded-full bg-[#e4d6bf] px-3 py-0.5 text-sm font-bold text-[#3b2a22]">
            {connectedPlayers.length}
          </span>
        </div>


        {connectedPlayers.length ? (
          <ul className="mt-3 divide-y divide-[#d8c8b0]" aria-live="polite">
            {connectedPlayers.map(([uid, player], index) => {
              const isViewer = uid === viewerUid;

              return (
                <li key={uid} className="flex min-h-11 items-center gap-3 py-2">
                  <span
                    title="Assento"
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                      isViewer
                        ? "bg-[#7d2330] text-[#fffaf0]"
                        : "bg-[#e4d6bf] text-[#3b2a22]"
                    }`}
                  >
                    {player.seat ?? index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {player.name}
                  </span>
                  {isViewer && (
                    <span className="text-xs font-semibold text-[#7d2330]">
                      Você
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#75685f]">
            Ninguém sentou ainda. Compartilhe o código {code} com os jogadores.
          </p>
        )}
      </div>

      <footer className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-[#bdb7ad]">
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${
            connectionStatus === "connected"
              ? "bg-[#6f9b77]"
              : connectionStatus === "unavailable"
                ? "bg-[#a33843]"
                : "bg-[#c18b2f]"
          }`}
        />
        <span aria-live="polite">
          {connectionLabels[connectionStatus]}
          {updating ? ", atualizando a mesa…" : ""}
        </span>
      </footer>

      <RolesGuideButton />
    </section>
  );
}
