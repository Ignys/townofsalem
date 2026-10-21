"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate, observeMafiaTeam } from "@/lib/firebase/realtime-database-repository";
import type { MafiaTeamMemberRecord, NightTeam } from "@/types";

function sameTeam(
  left: Readonly<Record<string, MafiaTeamMemberRecord>>,
  right: Readonly<Record<string, MafiaTeamMemberRecord>>,
): boolean {
  const leftUids = Object.keys(left);
  return leftUids.length === Object.keys(right).length
    && leftUids.every((uid) => right[uid]?.roleId === left[uid].roleId);
}

/**
 * No computador do mestre (nos dois modos): publica para a Máfia quem é da Máfia, a partir
 * das roles privadas. Acompanha mudanças de role (ex.: Amnesiac que lembra uma role da Máfia).
 */
export function useMirrorMafiaTeam(gameId: string, hostUid: string, nightTeam: NightTeam = "mafia") {
  const privateRoles = useHostRoleAssignments(gameId, hostUid);
  const [published, setPublished] = useState<Record<string, MafiaTeamMemberRecord> | null>(null);
  const writingRef = useRef(false);

  useEffect(
    () => observeMafiaTeam(gameId, {
      onData: (value) => setPublished(value ?? {}),
      onError: () => setPublished(null),
    }, nightTeam),
    [gameId, nightTeam],
  );

  const team = useMemo(
    () => Object.fromEntries(
      Object.entries(privateRoles.assignments)
        .filter(([, assignment]) => nightTeam === "vampire" ? assignment.roleId === "vampire" : assignment.faction === "mafia")
        .map(([uid, assignment]) => [uid, { roleId: assignment.roleId }]),
    ),
    [nightTeam, privateRoles.assignments],
  );

  useEffect(() => {
    if (!privateRoles.loaded || published === null || writingRef.current) return;
    if (Object.keys(privateRoles.assignments).length === 0 || sameTeam(team, published)) return;

    writingRef.current = true;
    applyAtomicUpdate({ [firebasePaths.gameMafiaTeam(gameId, nightTeam)]: team })
      .catch(() => undefined)
      .finally(() => {
        writingRef.current = false;
      });
  }, [gameId, nightTeam, privateRoles.assignments, privateRoles.loaded, published, team]);
}
