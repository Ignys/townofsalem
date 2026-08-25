interface PlayerRoleNoticeProps {
  loading?: boolean;
  message: string;
}

export function PlayerRoleNotice({
  loading = false,
  message,
}: PlayerRoleNoticeProps) {
  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1c1e] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
      <div
        aria-hidden="true"
        className={`mx-auto size-3 rounded-full ${
          loading ? "animate-pulse bg-[#c18b2f]" : "bg-[#a33843]"
        }`}
      />
      <h1 className="mt-5 font-serif text-2xl font-semibold text-[#fffaf0]">
        Sua role
      </h1>
      <p
        role={loading ? "status" : "alert"}
        className="mt-3 text-sm leading-6 text-[#bdb7ad]"
      >
        {message}
      </p>
    </section>
  );
}
