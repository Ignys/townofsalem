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
      className={`panel-private min-w-0 w-full scroll-mt-4 ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <h2 className="font-serif text-xl font-semibold text-[#fffaf0]">
          {title}
        </h2>
        {actions}
      </header>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
