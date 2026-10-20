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
    <div className="flex min-h-svh bg-[#14161a] bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(125,35,48,0.28),transparent)] px-4 py-10 text-[#f8f1e5] sm:px-8 sm:py-16">
      <main className="mx-auto flex w-full max-w-md flex-col justify-center">
        <header className="mb-8 text-center">
          <h1 className="font-serif text-5xl leading-none font-semibold tracking-[-0.03em] text-[#fffaf0] sm:text-6xl">
            Town of Salem
          </h1>
          <p className="mt-3 text-sm text-[#a9a39a] sm:text-base">
            Escolha a sala do seu moderador e entre na cidade.
          </p>
        </header>

        <HomeGameActions initialRoomCode={initialRoomCode} />

        <Link
          href="/roles"
          className="mt-6 text-center text-sm font-semibold text-[#d3b88c] hover:text-[#e6cfa9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d3b88c]"
        >
          Consultar enciclopédia de roles
        </Link>
      </main>
    </div>
  );
}
