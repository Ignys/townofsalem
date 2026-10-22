"use client";

import { BookOpen, X } from "lucide-react";
import { useRef } from "react";

import { MAFIA_ROLES, NEUTRAL_ROLES, TOWN_ROLES } from "@/data/roles";
import { roleNameColor } from "@/features/game-state/game-composition-board";
import { RANDOM_ROLE_SLOTS } from "@/features/roles/random-role-slots";

const FACTIONS = [
  { id: "town", label: "Cidade", roles: TOWN_ROLES },
  { id: "mafia", label: "Máfia", roles: MAFIA_ROLES },
  { id: "neutral", label: "Neutros", roles: NEUTRAL_ROLES },
] as const;

interface RolesGuideButtonProps {
  /** Composição do jogo em andamento; sem ela, todas as roles aparecem em destaque. */
  roleComposition?: Readonly<Record<string, number>> | null;
  /** Roles que o mestre tirou dos sorteios aleatórios. */
  randomRoleExclusions?: readonly string[];
}

/** Botão de rodapé que abre o catálogo de todas as roles do jogo. */
export function RolesGuideButton({ roleComposition, randomRoleExclusions = [] }: RolesGuideButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Um slot aleatório pode virar qualquer role não excluída da facção dele, então elas contam como possíveis.
  const inGame = (roleId: string, faction: string) =>
    !roleComposition ||
    (roleComposition[roleId] ?? 0) > 0 ||
    (!randomRoleExclusions.includes(roleId) && RANDOM_ROLE_SLOTS.some(
      (slot) => (slot.faction === null || slot.faction === faction) && (roleComposition[slot.id] ?? 0) > 0,
    ));

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
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#3a2f2a] bg-[#1c1715] p-0 text-[#efe3cf] shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop:bg-black/70"
      >
        <div className="flex max-h-[80svh] flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-[#3a2f2a] p-5 pb-4">
            <h2 id="roles-guide-title" className="font-serif text-2xl font-semibold">
              Roles do jogo
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-[#b8a894] hover:bg-white/5 focus-visible:outline-3 focus-visible:outline-[#c18b2f]"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>

          <div className="overflow-y-auto p-5 pt-2">
            {FACTIONS.map(({ id, label, roles }) => {
              // sort é estável: dentro de cada grupo a ordem do alinhamento se mantém.
              const sorted = [...roles].sort((a, b) => Number(inGame(b.id, id)) - Number(inGame(a.id, id)));
              return (
                <section key={id} className="mt-5 first:mt-2">
                  <h3 className="font-serif text-lg font-semibold" style={{ color: roleNameColor("", id) }}>
                    {label}
                  </h3>
                  <ul className="mt-1 divide-y divide-[#2e2522]">
                    {sorted.map((role) => {
                      const color = roleNameColor(role.id, id) ?? "#efe3cf";
                      const present = inGame(role.id, id);
                      return (
                        <li key={role.id} className={present ? undefined : "opacity-40 grayscale-[60%]"}>
                          <details className="group">
                            <summary
                              className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-md px-1 hover:bg-white/3 focus-visible:outline-2 focus-visible:outline-[#c18b2f]"
                            >
                              <span aria-hidden="true" className="h-5 w-1 rounded-full" style={{ backgroundColor: color }} />
                              <span className="font-semibold" style={{ color }}>{role.name}</span>
                              {!present && <span className="text-xs text-[#9c8c7a]">fora deste jogo</span>}
                              <span aria-hidden="true" className="ml-auto text-[#9c8c7a] transition-transform group-open:rotate-90">›</span>
                            </summary>
                            <div className="grid gap-1.5 pb-3 pl-5 text-sm leading-6 text-[#d9ccb8]">
                              <p><strong className="text-[#efe3cf]">Objetivo:</strong> {role.goal}</p>
                              <p>{role.description}</p>
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </dialog>
    </>
  );
}
