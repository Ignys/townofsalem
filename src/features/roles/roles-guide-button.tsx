"use client";

import { BookOpen, X } from "lucide-react";
import { useRef } from "react";

import { MAFIA_ROLES, NEUTRAL_ROLES, TOWN_ROLES } from "@/data/roles";
import { FACTION_TAGS } from "@/features/game-state/game-composition-board";

const FACTIONS = [
  { id: "town", label: "Cidade", roles: TOWN_ROLES },
  { id: "mafia", label: "Máfia", roles: MAFIA_ROLES },
  { id: "neutral", label: "Neutros", roles: NEUTRAL_ROLES },
] as const;

/** Botão de rodapé que abre o catálogo de todas as roles do jogo. */
export function RolesGuideButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="mx-auto mt-6 flex min-h-11 items-center gap-2 rounded-xl border border-[#e0cfb4]/40 px-5 text-sm font-semibold text-[#f6dfb5] hover:bg-white/5 focus-visible:outline-3 focus-visible:outline-[#c18b2f]"
      >
        <BookOpen aria-hidden="true" className="size-4" />
        Ver roles do jogo
      </button>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        aria-labelledby="roles-guide-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#e0cfb4] bg-[#f4ead9] p-0 text-[#251f1d] shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop:bg-black/70"
      >
        <div className="flex max-h-[80svh] flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-[#d8c8b0] p-5 pb-4">
            <h2 id="roles-guide-title" className="font-serif text-2xl font-semibold">
              Roles do jogo
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-[#5b4d44] hover:bg-[#e4d6bf] focus-visible:outline-3 focus-visible:outline-[#7d2330]"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>

          <div className="overflow-y-auto p-5 pt-3">
            {FACTIONS.map(({ id, label, roles }) => (
              <section key={id} className="mt-3 first:mt-0">
                <h3 className="text-xs font-bold tracking-wide text-[#75685f] uppercase">{label}</h3>
                <ul className="mt-1.5 grid gap-1.5">
                  {roles.map((role) => (
                    <li key={role.id}>
                      <details className="group rounded-lg border border-[#d8c8b0] bg-[#fbf4e8]">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold">
                          <span className={`rounded-md border px-2 py-0.5 text-xs ${FACTION_TAGS[id]}`}>
                            {role.name}
                          </span>
                          <span className="truncate text-xs font-normal text-[#75685f]">{role.alignment}</span>
                          <span aria-hidden="true" className="ml-auto text-[#75685f] group-open:rotate-90">›</span>
                        </summary>
                        <div className="grid gap-1.5 px-3 pb-3 text-sm leading-6">
                          <p><strong>Objetivo:</strong> {role.goal}</p>
                          <p>{role.description}</p>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
