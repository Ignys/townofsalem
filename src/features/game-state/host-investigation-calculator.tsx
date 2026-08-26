"use client";

import { useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { calculateInvestigationInteraction } from "@/game-engine/interaction-calculator";

export function HostInvestigationCalculator() {
  const [targetRoleId, setTargetRoleId] = useState("");
  const targetRole = ROLE_DEFINITIONS.find(({ id }) => id === targetRoleId);
  const investigation = targetRole
    ? calculateInvestigationInteraction(
        {
          uid: "simulation-target",
          name: targetRole.name,
          alive: true,
          roleId: targetRole.id,
          faction: targetRole.faction,
          canDieAtNight: targetRole.canDieAtNight,
          statuses: [],
          investigativeAppearance: targetRole.investigativeAppearance,
        },
        "sheriff",
      )
    : null;

  return (
    <details className="rounded-3xl border border-white/10 bg-[#1a1c1e] p-5 sm:p-7">
      <summary className="cursor-pointer font-serif text-xl font-semibold">
        Calculadora de investigação
      </summary>
      <p className="mt-2 text-sm text-[#9f9990]">
        Simulação isolada: não altera a partida.
      </p>
      <label className="mt-4 grid gap-1 text-sm font-semibold">
        Aparência para investigação Sheriff
        <select
          value={targetRoleId}
          onChange={(event) => setTargetRoleId(event.target.value)}
          className="min-h-11 rounded-xl border border-white/15 bg-[#161719] px-3"
        >
          <option value="">Selecione uma role</option>
          {ROLE_DEFINITIONS.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </label>
      {investigation && (
        <p className="mt-3 text-sm">
          {investigation.supported
            ? `Resultado: ${investigation.result}`
            : "Regra ainda não modelada."}{" "}
          <span className="text-xs text-[#9f9990]">
            ({investigation.reasonCode})
          </span>
        </p>
      )}
    </details>
  );
}
