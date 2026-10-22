"use client";

import { ArrowLeft, Dices } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { getRoleById } from "@/data/roles";
import { PlayerRoleCard } from "@/features/game-state/player-role-card";
import { useGameVariants } from "@/features/game-variants/use-game-variants";
import type { RoleDefinition } from "@/types";

import { getRandomRoleSlot } from "./random-role-slots";
import { roleNameColor } from "./role-colors";
import { orderSelectedRoles } from "./role-composition-order";
import { RoleBonusRules } from "./role-bonus-rules";
import { RoleLibrary } from "./role-library";
import { PlayerLobbyHeader } from "@/features/lobby/player-lobby-header";
import { useRoleComposition } from "./use-role-composition";

/** Aba Roles do lobby do jogador: o que está nesta partida primeiro, depois a biblioteca inteira. */
export function PlayerLobbyRolesTab({ gameId, playerCount }: Readonly<{ gameId: string; playerCount: number }>) {
  const composition = useRoleComposition(gameId);
  const { variants } = useGameVariants(gameId);
  const [selected, setSelected] = useState<RoleDefinition | null>(null);
  // Voltar da role devolve a lista ao ponto em que o jogador estava.
  const listScroll = useRef(0);

  useLayoutEffect(() => {
    window.scrollTo({ top: selected ? 0 : listScroll.current });
  }, [selected]);

  const open = (role: RoleDefinition) => {
    listScroll.current = window.scrollY;
    setSelected(role);
  };

  if (selected) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mb-4 flex min-h-11 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-[#d3b88c] focus-visible:outline-2 focus-visible:outline-[#c18b2f]"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todas as roles
        </button>
        {/* Regras desta sala, não as padrão: é o que vai valer na partida. */}
        <PlayerRoleCard role={selected} variants={variants} playerCount={playerCount} />
        <RoleBonusRules roleId={selected.id} roomVariants={variants} />
      </div>
    );
  }

  const grouped = new Map<string, number>();
  for (const { roleId } of orderSelectedRoles(composition.roleIds, "natural")) grouped.set(roleId, (grouped.get(roleId) ?? 0) + 1);
  const inGame = new Set(grouped.keys());

  return (
    <div>
      <PlayerLobbyHeader title="Biblioteca">Toque numa role para ver tudo o que ela faz.</PlayerLobbyHeader>

      <section aria-labelledby="in-game-roles-title" className="mt-8">
        <h2 id="in-game-roles-title" className="text-sm font-semibold text-[#d7d0c4]">
          Nesta partida
        </h2>
        {grouped.size === 0 ? (
          <p className="mt-2 text-sm text-[#8d877e]">O mestre ainda não escolheu as roles.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {[...grouped].map(([roleId, count]) => {
              const role = getRoleById(roleId);
              const slot = getRandomRoleSlot(roleId);
              const label = (
                <>
                  {slot && <Dices aria-hidden="true" className="size-3.5" />}
                  {role?.name ?? slot?.name ?? roleId}
                  {count > 1 && <span className="text-[#8d877e] tabular-nums">×{count}</span>}
                </>
              );
              return (
                <li key={roleId}>
                  {role ? (
                    <button
                      type="button"
                      onClick={() => open(role)}
                      className="flex min-h-9 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 text-sm font-semibold active:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-[#c18b2f]"
                      style={{ color: roleNameColor(role.id, role.faction) }}
                    >
                      {label}
                    </button>
                  ) : (
                    <span className="flex min-h-9 items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3 text-sm font-semibold text-[#d3b88c]">{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <RoleLibrary onSelect={open} highlightIds={inGame} className="mt-6" />
    </div>
  );
}
