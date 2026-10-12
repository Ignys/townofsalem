"use client";

import { useEffect, useRef, useState } from "react";

import { useHostRoleAssignments } from "@/features/roles/use-host-role-assignments";
import { observeMayorReveals } from "@/lib/firebase/realtime-database-repository";

/** Mayors que se revelaram pelo celular (uid → momento). Público para a partida. */
export function useMayorReveals(gameId: string): Readonly<Record<string, number>> {
  const [reveals, setReveals] = useState<Record<string, number>>({});

  useEffect(
    () => observeMayorReveals(gameId, {
      onData: (value) => setReveals(value ?? {}),
      onError: () => setReveals({}),
    }),
    [gameId],
  );

  return reveals;
}

/**
 * No computador do mestre (com ou sem mestre): leva a revelação pública do Mayor para o
 * status privado que o motor usa (peso do voto, Doctor não protege).
 */
export function useMirrorMayorReveals(gameId: string, hostUid: string, enabled: boolean) {
  const reveals = useMayorReveals(gameId);
  const privateRoles = useHostRoleAssignments(gameId, hostUid);
  const mirroredRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !privateRoles.loaded) return;
    for (const uid of Object.keys(reveals)) {
      if (privateRoles.assignments[uid]?.statuses?.["mayor-revealed"] || mirroredRef.current.has(uid)) continue;
      mirroredRef.current.add(uid);
      void import("./update-player-status")
        .then(({ updatePlayerStatus }) => updatePlayerStatus(gameId, uid, "mayor-revealed", true))
        .catch(() => mirroredRef.current.delete(uid));
    }
  }, [enabled, gameId, privateRoles.assignments, privateRoles.loaded, reveals]);
}
