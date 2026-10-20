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

interface RealtimeLobbyViewProps {
  code: string;
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
function useRoomName(code: string): string | null {
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

export function RealtimeLobbyView({
  code,
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
        : "Aguardando o mestre iniciar a partida.";

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
          <h2 className="font-serif text-base font-semibold">{lobbyStatus}</h2>
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
