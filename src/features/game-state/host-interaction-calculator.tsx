"use client";

import { useState } from "react";

import { ROLE_DEFINITIONS } from "@/data/roles";
import { calculateAttackInteraction, calculateInvestigationInteraction } from "@/game-engine/interaction-calculator";
import type { AttackLevel, DefenseLevel, RoleDefinition } from "@/types";

export function HostInteractionCalculator() {
  const [attack, setAttack] = useState<AttackLevel>("basic");
  const [defense, setDefense] = useState<DefenseLevel>("none");
  const [targetRoleId, setTargetRoleId] = useState("");
  const attackResult = calculateAttackInteraction(attack, defense, []);
  const targetRole: RoleDefinition | undefined = ROLE_DEFINITIONS.find(({ id }) => id === targetRoleId);
  const investigativeAppearance = targetRole?.investigativeAppearance;
  const investigation = targetRole ? calculateInvestigationInteraction({ uid: "simulation-target", name: targetRole.name, alive: true, roleId: targetRole.id, faction: targetRole.faction, defense: targetRole.defense === "needs-verification" ? "none" : targetRole.defense, statuses: [], investigativeAppearance }, "sheriff") : null;

  return (
    <details className="rounded-3xl border border-white/10 bg-[#1a1c1e] p-5 sm:p-7">
      <summary className="cursor-pointer font-serif text-xl font-semibold">Calculadora de interações</summary>
      <p className="mt-2 text-sm text-[#9f9990]">Simulação isolada: não altera a partida.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">Nível do ataque<select value={attack} onChange={(event) => setAttack(event.target.value as AttackLevel)} className="min-h-11 rounded-xl border border-white/15 bg-[#161719] px-3">{["none", "basic", "powerful", "unstoppable"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Defesa do alvo<select value={defense} onChange={(event) => setDefense(event.target.value as DefenseLevel)} className="min-h-11 rounded-xl border border-white/15 bg-[#161719] px-3">{["none", "basic", "powerful", "invincible"].map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm">{attackResult.reasonCode === "INTERACTION_NOT_CONFIGURED" ? "Regra de ataque/defesa ainda não modelada para esta combinação." : attackResult.success ? "O ataque vence a defesa configurada." : "A defesa impede o ataque configurado."} <span className="text-xs text-[#9f9990]">({attackResult.reasonCode})</span></p>
      <label className="mt-4 grid gap-1 text-sm font-semibold">Aparência para investigação Sheriff<select value={targetRoleId} onChange={(event) => setTargetRoleId(event.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-[#161719] px-3"><option value="">Selecione uma role</option>{ROLE_DEFINITIONS.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
      {investigation && <p className="mt-3 text-sm">{investigation.supported ? `Resultado: ${investigation.result}` : "Regra ainda não modelada."} <span className="text-xs text-[#9f9990]">({investigation.reasonCode})</span></p>}
    </details>
  );
}
