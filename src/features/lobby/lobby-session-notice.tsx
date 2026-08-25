import Link from "next/link";

interface LobbySessionNoticeProps {
  message: string;
  loading?: boolean;
}

export function LobbySessionNotice({
  message,
  loading = false,
}: LobbySessionNoticeProps) {
  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1c1e] p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-8">
      <p
        role={loading ? "status" : "alert"}
        aria-live="polite"
        className="text-sm leading-6 text-[#d8d1c7]"
      >
        {message}
      </p>
      {!loading && (
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7d2330] px-5 py-2 font-semibold text-white hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d3b88c]"
        >
          Voltar ao início
        </Link>
      )}
    </section>
  );
}
