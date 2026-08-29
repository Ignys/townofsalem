import { PlayerGameSession } from "@/features/game-state/player-game-session";

interface PlayerGamePageProps {
  params: Promise<{ code: string }>;
}

export default async function PlayerGamePage({ params }: PlayerGamePageProps) {
  const { code } = await params;

  return (
    <main className="flex min-h-svh items-start justify-center bg-[#111315] px-5 py-8 text-[#f8f1e5]">
      <PlayerGameSession key={code} roomCode={code} />
    </main>
  );
}
