import { Skull, Trophy } from "lucide-react";

import { getRoleById } from "@/data/roles";
import { FACTION_LABELS } from "@/features/roles/role-presentation";
import type { GamePublicRecord, PublicPlayerRecord } from "@/lib/firebase/schema";
import type { Faction } from "@/types";

import { getPlayerEntries } from "./player-roster";
import { RoleTag } from "./player-status-board";

interface GameOverCardProps {
  game: GamePublicRecord;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

/** Fim de jogo, igual para a mesa e para os celulares: vencedores, sobreviventes e as roles. */
export function GameOverCard({ game, players }: GameOverCardProps) {
  if (game.status !== "finished") return null;

  const winningFactions = game.winningFactions ?? [];
  const finalRoles = game.finalRoles ?? {};
  const entries = getPlayerEntries(players);
  // Vence quem é de uma facção vencedora, mais quem venceu sozinho (Jester, Executioner...).
  const winnerUids = new Set([
    ...(game.winningPlayerUids ?? []),
    ...entries
      .filter(([uid]) => {
        const faction = getRoleById(finalRoles[uid] ?? "")?.faction;
        return faction ? winningFactions.includes(faction) : false;
      })
      .map(([uid]) => uid),
  ]);
  const winners = entries.filter(([uid]) => winnerUids.has(uid));
  const title = winningFactions.length > 0
    ? `Vitória: ${winningFactions.map((faction) => FACTION_LABELS[faction as Faction] ?? faction).join(" e ")}`
    : winners.length > 0
      ? "Partida encerrada"
      : "Partida encerrada sem vencedor";

  return (
    <div className="grid gap-4">
      <section
        aria-label="Vencedores"
        className="relative overflow-hidden rounded-3xl border border-[#6b5532]/60 bg-[linear-gradient(180deg,#3a2a17_0%,#211b16_75%)] p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full bg-[#f2b85c]/25 blur-2xl"
        />
        <Trophy aria-hidden="true" className="relative mx-auto size-8 text-[#f2c879]" />
        <h2 className="relative mt-2 font-serif text-3xl font-semibold text-[#fffaf0]">{title}</h2>
        {winners.length > 0 && (
          <p className="relative mt-2 text-sm leading-6 text-[#e6cfa9]">
            {winners.map(([, player]) => player.name).join(", ")}
          </p>
        )}
      </section>

      {Object.keys(finalRoles).length > 0 && (
        <section aria-label="Roles da partida" className="panel-public">
          <h2 className="font-serif text-base font-semibold">Roles da partida</h2>
          {/* Vivo claro, morto escurecido: tons neutros, para não confundir com as facções. */}
          <ul className="mt-3 grid gap-1.5">
            {entries.map(([uid, player]) => (
              <li
                key={uid}
                className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                  player.alive ? "bg-[#fffaf1] shadow-[0_1px_0_#d8c8b0]" : "bg-[#dfd3c0]"
                }`}
              >
                {!player.alive && <Skull aria-label="Morto" className="size-4 shrink-0 text-[#7a6e66]" />}
                <span
                  className={`min-w-0 flex-1 truncate font-semibold ${
                    player.alive ? "text-[#251f1d]" : "text-[#6f645c] line-through"
                  }`}
                >
                  {player.name}
                </span>
                {winnerUids.has(uid) && (
                  <Trophy aria-label="Venceu" className="size-4 shrink-0 text-[#b8862f]" />
                )}
                {finalRoles[uid] && <RoleTag roleId={finalRoles[uid]} />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
