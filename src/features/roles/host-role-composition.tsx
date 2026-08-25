"use client";

import { useMemo } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";

import { ROLE_COMPOSITION_RULES } from "./role-composition-rules";
import { CompositionTools } from "./composition-tools";
import { RoleCompositionValidation } from "./role-composition-validation";
import { RoleSelectionOptions } from "./role-selection-options";
import { SelectedRoleComposition } from "./selected-role-composition";
import { useRoleComposition } from "./use-role-composition";
import { useRoleDraw } from "./use-role-draw";
import { validateRoleComposition } from "./validate-role-composition";

interface HostRoleCompositionProps {
  gameId: string;
  playerCount: number;
  editable: boolean;
}

export function HostRoleComposition({
  gameId,
  playerCount,
  editable,
}: HostRoleCompositionProps) {
  const composition = useRoleComposition(gameId);
  const roleDraw = useRoleDraw();
  const selectedRoleCounts = useMemo(
    () => composition.roleIds.reduce<Record<string, number>>((counts, roleId) => {
      counts[roleId] = (counts[roleId] ?? 0) + 1;
      return counts;
    }, {}),
    [composition.roleIds],
  );
  const validation = validateRoleComposition({
    roleIds: composition.roleIds,
    playerCount,
  });
  const controlsDisabled =
    !editable ||
    !composition.loaded ||
    composition.saving ||
    roleDraw.drawing;

  const persistRoleIds = async (roleIds: readonly string[]) => {
    roleDraw.clearFeedback();
    await composition.updateRoleIds(roleIds);
  };

  const handleAdd = (roleId: string) => {
    if (
      (selectedRoleCounts[roleId] ?? 0) >=
        (ROLE_DEFINITIONS.find((role) => role.id === roleId)?.cardCount ?? 0)
    ) {
      return;
    }

    void persistRoleIds([...composition.roleIds, roleId]);
  };

  const handleRemove = (index: number) => {
    void persistRoleIds(
      composition.roleIds.filter((_, roleIndex) => roleIndex !== index),
    );
  };

  if (!editable) {
    return (
      <section className="w-full rounded-3xl border border-[#6f9b77]/25 bg-[#1a1c1e] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-7">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">
          Configuração concluída
        </p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-[#fffaf0]">
          Composição bloqueada
        </h2>
        <p
          role={roleDraw.feedback?.kind === "error" ? "alert" : "status"}
          className={`mt-3 text-sm leading-6 ${
            roleDraw.feedback?.kind === "error"
              ? "text-[#f0b9bd]"
              : "text-[#bfe0c5]"
          }`}
        >
          {roleDraw.feedback?.message ??
            "As roles foram atribuídas e não podem ser sorteadas novamente."}
        </p>
      </section>
    );
  }

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-[#1a1c1e] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#d3b88c] uppercase">
          Configuração do mestre
        </p>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-[#fffaf0]">
          Composição de roles
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#bdb7ad]">
          Escolha uma role distinta para cada jogador conectado. As alterações
          são salvas automaticamente.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-black/15 p-4">
          <p className="text-xs text-[#9f9990]">Roles selecionadas</p>
          <p className="mt-1 text-2xl font-bold text-[#fffaf0]">
            {composition.roleIds.length}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/15 p-4">
          <p className="text-xs text-[#9f9990]">Jogadores conectados</p>
          <p className="mt-1 text-2xl font-bold text-[#fffaf0]">
            {playerCount}
          </p>
        </div>
      </div>

      <CompositionTools
        playerCount={playerCount}
        roleIds={composition.roleIds}
        disabled={controlsDisabled}
        onApply={(roleIds) => void persistRoleIds(roleIds)}
      />

      <section className="mt-7">
        <h3 className="mb-3 font-semibold text-[#fffaf0]">
          Composição selecionada
        </h3>
        <SelectedRoleComposition
          roleIds={composition.roleIds}
          disabled={controlsDisabled}
          onRemove={handleRemove}
        />
      </section>

      <section className="mt-7 border-t border-white/10 pt-7">
        <h3 className="mb-4 font-semibold text-[#fffaf0]">
          Roles disponíveis
        </h3>
        <RoleSelectionOptions
          roles={ROLE_DEFINITIONS}
          selectedRoleCounts={selectedRoleCounts}
          allowDuplicateRoleIds={ROLE_COMPOSITION_RULES.allowDuplicateRoleIds}
          disabled={controlsDisabled}
          onAdd={handleAdd}
        />
      </section>

      <div className="mt-7 border-t border-white/10 pt-6">
        {!composition.loaded ? (
          <p role="status" className="text-sm text-[#bdb7ad]">
            Carregando composição…
          </p>
        ) : composition.error ? (
          <p
            role="alert"
            className="rounded-xl border border-[#a33843]/35 bg-[#a33843]/10 px-4 py-3 text-sm text-[#f0b9bd]"
          >
            Não foi possível salvar ou acompanhar a composição. Tente
            novamente.
          </p>
        ) : (
          <RoleCompositionValidation result={validation} />
        )}

        <button
          type="button"
          onClick={() => void roleDraw.start(gameId, validation)}
          disabled={
            !editable ||
            !composition.loaded ||
            composition.saving ||
            roleDraw.drawing ||
            !validation.valid
          }
          className="mt-4 min-h-12 w-full rounded-xl bg-[#7d2330] px-5 py-3 font-bold text-white transition-colors hover:bg-[#681c27] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#d3b88c] disabled:cursor-not-allowed disabled:bg-[#5d5552]"
        >
          {roleDraw.drawing ? "Sorteando roles…" : "Sortear roles"}
        </button>

        <p
          role={roleDraw.feedback?.kind === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`mt-3 min-h-5 text-sm ${
            roleDraw.feedback?.kind === "error"
              ? "text-[#f0b9bd]"
              : roleDraw.feedback?.kind === "success"
                ? "text-[#bfe0c5]"
                : "text-[#bdb7ad]"
          }`}
        >
          {composition.saving
            ? "Salvando composição…"
            : roleDraw.feedback?.message ?? ""}
        </p>
      </div>
    </section>
  );
}
