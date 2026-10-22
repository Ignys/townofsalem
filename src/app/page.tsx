import { BookOpen } from "lucide-react";
import Link from "next/link";

import { HomeGameActions } from "@/features/lobby/home-game-actions";
import { SalemSkyline } from "@/features/lobby/salem-skyline";

interface HomePageProps {
  searchParams: Promise<{ code?: string | string[] }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const requestedCode = (await searchParams).code;
  const initialRoomCode =
    typeof requestedCode === "string" ? requestedCode : "";

  return (
    <div className="flex min-h-svh bg-[#14161a] bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(125,35,48,0.28),transparent)] px-4 py-10 text-[#f8f1e5] max-sm:px-0 max-sm:pt-[max(1.25rem,env(safe-area-inset-top))] max-sm:pb-0 sm:px-8 sm:py-16">
      <main className="mx-auto flex w-full max-w-md flex-col justify-center max-sm:justify-start">
        {/* Celular: o título fica sobre a cidade e o pergaminho sobe da base como uma folha. */}
        <header className="relative mb-8 text-center max-sm:mb-0">
          <Link
            href="/roles"
            className="absolute top-0 right-4 flex min-h-10 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 text-xs font-semibold text-[#d3b88c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] sm:hidden"
          >
            <BookOpen aria-hidden="true" className="size-3.5" />
            Roles
          </Link>
          <h1 className="font-serif text-5xl leading-none font-semibold tracking-[-0.03em] text-[#fffaf0] max-sm:mt-16 max-sm:text-[3.25rem] sm:text-6xl">
            Town of Salem
          </h1>
          <p className="mt-3 text-sm text-[#a9a39a] sm:text-base">
            Escolha a sala do seu moderador e entre na cidade.
          </p>
          <SalemSkyline className="mt-4 -mb-6 block h-28 w-full sm:hidden" />
        </header>

        <HomeGameActions initialRoomCode={initialRoomCode} />

        <Link
          href="/roles"
          className="mt-6 text-center text-sm font-semibold text-[#d3b88c] hover:text-[#e6cfa9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d3b88c] max-sm:hidden"
        >
          Consultar enciclopédia de roles
        </Link>
      </main>
    </div>
  );
}
