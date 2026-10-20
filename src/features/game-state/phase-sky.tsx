import type { ReactNode } from "react";

/** O céu da fase: o mesmo para os jogadores e para o mestre. */
export function PhaseSky({
  night,
  className = "",
  children,
}: Readonly<{ night: boolean; className?: string; children: ReactNode }>) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border shadow-[0_24px_70px_rgba(0,0,0,0.4)] ${
        night
          ? "border-[#34405e] bg-[linear-gradient(180deg,#0e1424_0%,#151c30_100%)]"
          : "border-[#6b5532]/60 bg-[linear-gradient(180deg,#3a2a17_0%,#211b16_70%)]"
      } ${className}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full blur-2xl ${
          night ? "bg-[#9fb3e0]/15" : "bg-[#f2b85c]/25"
        }`}
      />
      <div className="relative">{children}</div>
    </section>
  );
}
