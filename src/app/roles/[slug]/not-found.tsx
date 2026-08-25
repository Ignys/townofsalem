import Link from "next/link";

export default function RoleNotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#111315] px-5 text-[#f8f1e5]">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1c1e] p-8 text-center">
        <p className="text-xs font-bold tracking-[0.18em] text-[#d3b88c] uppercase">
          Enciclopédia
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold">
          Role não encontrada
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#bdb7ad]">
          Essa role não faz parte do catálogo atual.
        </p>
        <Link
          href="/roles"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#7d2330] px-5 py-2 font-bold text-white hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d3b88c]"
        >
          Ver todas as roles
        </Link>
      </section>
    </main>
  );
}
