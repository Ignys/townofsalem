import type { ReactNode } from "react";

interface HostConsoleFrameProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  id?: string;
  className?: string;
  contentClassName?: string;
}

export function HostConsoleFrame({
  title,
  children,
  actions,
  id,
  className = "",
  contentClassName = "mt-3",
}: HostConsoleFrameProps) {
  return (
    <section
      id={id}
      className={`min-w-0 w-full scroll-mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-2">
        <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-50/60 uppercase">
          {title}
        </h2>
        {actions}
      </header>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
