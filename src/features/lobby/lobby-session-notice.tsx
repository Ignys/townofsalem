import Link from "next/link";

interface LobbySessionNoticeProps {
  message: string;
  loading?: boolean;
  title?: string;
  showHomeLink?: boolean;
}

// Tela de espera/erro compartilhada: vela acesa enquanto carrega, apagada quando algo falhou.
// Cena fixa em tela cheia, sempre centralizada, independente do layout pai.
export function LobbySessionNotice({
  message,
  loading = false,
  title,
  showHomeLink = !loading,
}: LobbySessionNoticeProps) {
  return (
    <section className="fixed inset-0 z-40 grid place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#24201b_0%,#111315_60%)] px-4">
      <div className="flex max-w-xs flex-col items-center text-center">
        <div aria-hidden="true" className="relative h-36 w-24">
          {loading && (
            <div className="candle-halo absolute left-1/2 -top-6 size-32 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,170,72,0.4),transparent_68%)]" />
          )}
          <svg viewBox="0 0 64 96" className="relative h-full w-full">
            {loading ? (
              <>
                <path className="candle-flame" d="M32 10c6 9 10 15 10 22a10 10 0 0 1-20 0c0-7 4-13 10-22z" fill="url(#flame-lg)" />
                <path className="candle-flame" d="M32 22c3 5 5 8 5 12a5 5 0 0 1-10 0c0-4 2-7 5-12z" fill="#fff8de" opacity="0.85" />
              </>
            ) : (
              <path d="M32 36c-4-5 4-8 0-13s3-8 1-12" fill="none" stroke="#6b6660" strokeWidth="1.5" strokeLinecap="round" />
            )}
            <line x1="32" y1="40" x2="32" y2="46" stroke="#2a2522" strokeWidth="2" />
            <rect x="22" y="46" width="20" height="44" rx="3" fill={loading ? "#e9dcc4" : "#a99d8b"} />
            <path d="M22 50c4 3 6-1 10 2s6-2 10 0v-4H22z" fill={loading ? "#f6ecd8" : "#bdb09c"} />
            <path d="M40 50v9a2 2 0 0 1-4 0v-6z" fill={loading ? "#f6ecd8" : "#bdb09c"} />
            <defs>
              <linearGradient id="flame-lg" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#fff3c4" />
                <stop offset="0.5" stopColor="#f0b04a" />
                <stop offset="1" stopColor="#c8502e" />
              </linearGradient>
            </defs>
          </svg>
          {loading && (
            <div className="candle-halo absolute -bottom-3 left-1/2 h-4 w-40 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(232,170,72,0.28),transparent_70%)]" />
          )}
        </div>
        {title && <h1 className="mt-10 font-serif text-2xl font-semibold text-[#fffaf0]">{title}</h1>}
        <p
          role={loading ? "status" : "alert"}
          aria-live="polite"
          className={`${title ? "mt-2" : "mt-10"} font-serif text-lg italic leading-7 ${loading ? "text-[#d8cbb4]" : "text-[#e7c9c4]"}`}
        >
          {message}
        </p>
        {showHomeLink && (
          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7d2330] px-5 py-2 font-semibold text-white hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d3b88c]"
          >
            Voltar ao início
          </Link>
        )}
      </div>
    </section>
  );
}
