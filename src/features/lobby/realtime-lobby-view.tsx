import type {
  GamePublicRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";
import { getConnectedPlayerEntries } from "@/features/game-state/player-roster";

import type { FirebaseConnectionStatus } from "./use-firebase-connection";
import { RoomShareCard } from "./room-share-card";

interface RealtimeLobbyViewProps {
  code: string;
  viewer: "host" | "player";
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

export function RealtimeLobbyView({
  code,
  viewer,
  game,
  players,
  connectionStatus,
  updating,
}: RealtimeLobbyViewProps) {
  const connectedPlayers = getConnectedPlayerEntries(players);
  const gameFinished =
    game.status === "finished" || game.phase === "game-over";
  const gameInProgress = game.status === "in-progress";
  const lobbyStatus = gameFinished
    ? "Esta partida já terminou."
    : gameInProgress
      ? "A partida está em andamento."
      : viewer === "host"
        ? "Aguardando jogadores."
        : "Aguardando o mestre iniciar.";

  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1c1e] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-8">
      <header className="text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">
          {viewer === "host" ? "Lobby do mestre" : "Lobby da partida"}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold">
          Sala {code}
        </h1>
        {viewer === "host" && (
          <p className="mx-auto mt-3 w-fit rounded-full border border-[#d3b88c]/30 bg-[#d3b88c]/10 px-3 py-1 text-xs font-bold text-[#e6cfa9]">
            Você é o mestre
          </p>
        )}
        <p className="mt-4 text-sm leading-6 text-[#bdb7ad]">
          {lobbyStatus}
        </p>
      </header>

      {viewer === "host" && <RoomShareCard code={code} />}

      <div className="mt-7 flex items-center justify-between gap-4 border-b border-white/10 pb-3">
        <h2 className="font-semibold text-[#fffaf0]">Jogadores conectados</h2>
        <span className="rounded-full bg-white/8 px-3 py-1 text-sm font-bold text-[#e6cfa9]">
          {connectedPlayers.length}
        </span>
      </div>

      {connectedPlayers.length ? (
        <ul className="mt-3 grid gap-2" aria-live="polite">
          {connectedPlayers.map(([uid, player]) => (
            <li
              key={uid}
              className="flex min-h-11 items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-2"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[#6f9b77]"
              />
              <span className="min-w-0 flex-1 truncate font-medium text-[#f8f1e5]">
                {player.name}
              </span>
              {player.seat && (
                <span className="text-xs text-[#9f9990]">
                  Assento {player.seat}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-[#9f9990]">
          Nenhum jogador conectado.
        </p>
      )}

      <footer className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-xs font-medium text-[#bdb7ad]">
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
          {updating ? " · Atualizando lobby…" : ""}
        </span>
      </footer>
    </section>
  );
}
