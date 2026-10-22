import type { ReactNode } from "react";

/** Cabeçalho comum das abas do lobby do jogador (Mesa e Roles). */
export function PlayerLobbyHeader({ title, children }: Readonly<{ title: ReactNode; children?: ReactNode }>) {
  return (
    <header className="pt-2 text-center">
      <h1 className="font-serif text-[2.5rem] leading-tight font-semibold tracking-tight text-[#fffaf0]">{title}</h1>
      {children && <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-[#a9a297]">{children}</div>}
    </header>
  );
}
