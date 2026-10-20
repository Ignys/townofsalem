"use client";

import { useEffect, useId, useState } from "react";
import { Dices, Pin } from "lucide-react";

import { getRoleById } from "@/data/roles";
import { compositionRecordToRoleIds } from "@/features/roles/role-composition";
import { firebasePaths } from "@/lib/firebase/paths";
import {
  applyAtomicUpdate,
  observeForcedRoles,
  observeGameSettings,
} from "@/lib/firebase/realtime-database-repository";

interface HostForcedRoleControlProps {
  gameId: string;
  playerUid: string;
}

export function HostForcedRoleControl({ gameId, playerUid }: HostForcedRoleControlProps) {
  const selectId = useId();
  const [compositionRoleIds, setCompositionRoleIds] = useState<string[]>([]);
  const [forcedRoles, setForcedRoles] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handlers = { onError: () => setError(true) };
    const stopSettings = observeGameSettings(gameId, {
      ...handlers,
      onData: (settings) => setCompositionRoleIds(compositionRecordToRoleIds(settings?.roleComposition)),
    });
    const stopForced = observeForcedRoles(gameId, {
      ...handlers,
      onData: (value) => setForcedRoles(value ?? {}),
    });
    return () => {
      stopSettings();
      stopForced();
    };
  }, [gameId]);

  const current = forcedRoles[playerUid] ?? "";
  // Only fixed roles can be pinned; random slots stay a surprise.
  const options = [...new Set(compositionRoleIds)]
    .map((roleId) => getRoleById(roleId))
    .filter((role) => role !== undefined)
    .map((role) => {
      const total = compositionRoleIds.filter((id) => id === role.id).length;
      const taken = Object.entries(forcedRoles).filter(
        ([uid, id]) => id === role.id && uid !== playerUid,
      ).length;
      return { role, left: total - taken };
    });
  const currentMissing = current !== "" && !options.some(({ role }) => role.id === current);

  const save = async (roleId: string) => {
    setSaving(true);
    setError(false);
    try {
      await applyAtomicUpdate({
        [firebasePaths.gameForcedRole(gameId, playerUid)]: roleId || null,
      });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/8 bg-black/15 p-4">
      <label
        htmlFor={selectId}
        className="flex items-center gap-2 text-xs font-semibold text-[#9f9990] "
      >
        {current ? <Pin aria-hidden="true" size={14} /> : <Dices aria-hidden="true" size={14} />}
        Role no sorteio
      </label>
      <select
        id={selectId}
        value={current}
        disabled={saving}
        onChange={(event) => void save(event.target.value)}
        className="mt-3 min-h-11 w-full rounded-xl border border-white/12 bg-[#111214] px-3 text-sm font-semibold text-[#fffaf0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3b88c] disabled:opacity-60"
      >
        <option value="">Aleatório</option>
        {currentMissing && (
          <option value={current}>
            {getRoleById(current)?.name ?? current} (fora da composição)
          </option>
        )}
        {options.map(({ role, left }) => (
          <option key={role.id} value={role.id} disabled={left <= 0}>
            {role.name}
            {left <= 0 ? " (já atribuída)" : ""}
          </option>
        ))}
      </select>
      <p className={`mt-2 text-xs leading-5 ${error || currentMissing ? "text-[#f0b9bd]" : "text-[#9f9990]"}`}>
        {error
          ? "Não foi possível salvar a escolha. Tente novamente."
          : currentMissing
            ? "Essa role saiu da composição — escolha outra ou volte para aleatório."
            : "Só você vê isso. A role escolhida sai da composição antes do sorteio dos demais."}
      </p>
    </section>
  );
}
