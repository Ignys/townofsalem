import type { GamePublicRecord } from "@/lib/firebase/schema";

import { RoomShareCard } from "./room-share-card";
import type { FirebaseConnectionStatus } from "./use-firebase-connection";
import { Clock } from "lucide-react";

interface HostLobbyHeaderProps {
    code: string;
    game: GamePublicRecord;
    connectionStatus: FirebaseConnectionStatus;
    updating: boolean;
}

const connectionLabels: Record<FirebaseConnectionStatus, string> = {
    connecting: "Conectando…",
    connected: "Conectado",
    reconnecting: "Reconectando…",
    unavailable: "Conexão indisponível",
};

function getSessionLabel(game: GamePublicRecord) {
    if (game.status === "finished" || game.phase === "game-over") {
        return "Partida encerrada";
    }

    if (game.status === "in-progress") {
        return "Partida em andamento";
    }

    return "Aguardando jogadores";
}

export function HostLobbyHeader({ code, game, connectionStatus, updating }: HostLobbyHeaderProps) {
    return (
        <header className="w-full border-b border-[#2e3136]/70 bg-[#16181b] px-5 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-2 font-serif text-xl font-semibold text-[#fffaf0]">
                    <Clock aria-hidden="true" size={20} className="text-[#d3b88c]" />
                    {getSessionLabel(game)}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    <span
                        title={connectionLabels[connectionStatus] + (updating ? " · Atualizando…" : "")}
                        aria-hidden="true"
                        className={`size-2 rounded-full ${connectionStatus === "connected" ? "bg-[#6f9b77]" : connectionStatus === "unavailable" ? "bg-[#a33843]" : "bg-[#c18b2f]"}`}
                    />
                    <RoomShareCard code={code} />
                </div>
            </div>
        </header>
    );
}
