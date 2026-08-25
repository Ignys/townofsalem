import { HostLobbySession } from "@/features/lobby/host-lobby-session";

interface HostGamePageProps {
  params: Promise<{ code: string }>;
}

export default async function HostGamePage({ params }: HostGamePageProps) {
  const { code } = await params;

  return (
    <main className="flex min-h-svh overflow-x-clip items-start justify-center bg-[#111315] text-[#f8f1e5]">
      <HostLobbySession key={code} roomCode={code} />
    </main>
  );
}
