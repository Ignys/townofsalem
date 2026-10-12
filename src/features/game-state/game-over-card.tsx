import { FACTION_LABELS } from "@/features/roles/role-presentation";
import type { GamePublicRecord, PublicPlayerRecord } from "@/lib/firebase/schema";
import type { Faction } from "@/types";

interface GameOverCardProps {
  game: GamePublicRecord;
  players: Readonly<Record<string, PublicPlayerRecord>>;
}

/** Resultado da partida, igual para a mesa e para os celulares. */
export function GameOverCard({ game, players }: GameOverCardProps) {
  if (game.status !== "finished") return null;

  const factions = (game.winningFactions ?? []).map(
    (faction) => FACTION_LABELS[faction as Faction] ?? faction,
  );
  const winnerNames = (game.winningPlayerUids ?? [])
    .map((uid) => players[uid]?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <section
      aria-label="Partida encerrada"
      className="mt-4 rounded-2xl border border-[#d3b88c]/30 bg-[#d3b88c]/10 p-4 text-center"
    >
      <h2 className="font-serif text-xl font-semibold text-[#fffaf0]">Partida encerrada</h2>
      {factions.length > 0 && (
        <p className="mt-2 text-sm text-[#e6cfa9]">
          Vitória: <strong className="text-[#fffaf0]">{factions.join(", ")}</strong>
        </p>
      )}
      {winnerNames.length > 0 && (
        <p className="mt-1 text-sm text-[#e6cfa9]">Vencedores: {winnerNames.join(", ")}</p>
      )}
    </section>
  );
}
