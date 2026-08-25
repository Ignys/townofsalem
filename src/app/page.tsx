import { HomeGameActions } from "@/features/lobby/home-game-actions";
import Link from "next/link";

interface HomePageProps {
  searchParams: Promise<{ code?: string | string[] }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const requestedCode = (await searchParams).code;
  const initialRoomCode =
    typeof requestedCode === "string" ? requestedCode : "";

  return (
    <div className="relative flex min-h-svh overflow-hidden bg-[#111315] px-5 py-8 text-[#f8f1e5] sm:px-8 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(125,35,46,0.34),transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-8 size-64 rounded-full border border-white/[0.04]"
      />

      <main className="relative mx-auto flex w-full max-w-md flex-col justify-center sm:max-w-lg">
        <header className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-[#d3b88c]/40 bg-[#22191a] font-serif text-xl font-bold tracking-tight text-[#e6cfa9] shadow-[0_12px_36px_rgba(0,0,0,0.28)]">
            TS
          </div>
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">
            Board Game Companion
          </p>
          <h1 className="font-serif text-4xl leading-none font-semibold tracking-[-0.035em] text-[#fffaf0] sm:text-5xl">
            Town of Salem
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#bdb7ad] sm:text-base">
            Prepare a partida, reúna os jogadores e deixe o mestre focar na
            história.
          </p>
        </header>

        <HomeGameActions initialRoomCode={initialRoomCode} />

        <p className="mt-6 text-center text-xs leading-5 text-[#8f8a82]">
          Feito para partidas presenciais. Nenhuma conta ou senha necessária.
        </p>
        <Link
          href="/roles"
          className="mt-3 text-center text-sm font-semibold text-[#d3b88c] hover:text-[#e6cfa9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d3b88c]"
        >
          Consultar enciclopédia de roles
        </Link>
      </main>
    </div>
  );
}
