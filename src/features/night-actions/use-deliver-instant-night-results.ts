"use client";

import { useEffect, useRef } from "react";

import { getRoleById } from "@/data/roles";
import type { NightResolution } from "@/game-engine/types";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate, type AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";
import type { HostNightActionEntry, Player, PlayerInstantNightResultRecord } from "@/types";

import { buildPlayerInstantNightResults } from "./player-night-results";

/** Efeitos que mudam o resultado das ações dos outros; enquanto faltarem, nada sai na hora. */
const ORDER_SENSITIVE_EFFECTS = new Set(["roleblock", "redirect"]);

/**
 * Atores vivos cujas ações podem alterar o resultado das outras e que ainda não confirmaram.
 * Hoje nenhuma role usa esses efeitos; quando existir (Escort, Consort…), o resultado
 * instantâneo espera essas ações, e no pior caso sai quando o mestre aplica a noite.
 */
export function hasPendingOrderSensitiveActions(
  players: readonly Player[],
  assignments: Readonly<Record<string, string>>,
  entries: readonly HostNightActionEntry[],
): boolean {
  return players.some((player) => {
    if (!player.alive) return false;
    const role = getRoleById(assignments[player.uid]);
    const actions = role?.actionDefinitions ?? (role?.action ? [role.action] : []);

    return actions.some((action) =>
      ORDER_SENSITIVE_EFFECTS.has(action.engineEffectType ?? "")
      && !entries.some((entry) =>
        entry.actorUid === player.uid
        && entry.actionId === action.id
        && entry.status === "confirmed",
      ),
    );
  });
}

interface UseDeliverInstantNightResultsOptions {
  gameId: string;
  nightId: string;
  nightNumber: number;
  resolution: NightResolution | undefined;
  entries: readonly HostNightActionEntry[];
  players: readonly Player[];
  assignments: Readonly<Record<string, string>>;
  applied: boolean;
}

/**
 * Entrega investigações e pistas do Medium no celular do jogador assim que ele confirma.
 * Ações lançadas pelo mestre (que ainda podem mudar) só são entregues quando a noite é aplicada.
 */
export function useDeliverInstantNightResults({
  gameId,
  nightId,
  nightNumber,
  resolution,
  entries,
  players,
  assignments,
  applied,
}: UseDeliverInstantNightResultsOptions) {
  const deliveredRef = useRef(new Map<string, string>());

  useEffect(() => {
    if (!resolution || resolution.partial) return;
    if (!applied && hasPendingOrderSensitiveActions(players, assignments, entries)) return;

    const actorUids = new Set(
      entries
        .filter((entry) => entry.status === "confirmed" && (applied || entry.source === "player"))
        .map((entry) => entry.actorUid),
    );
    const playerNames = Object.fromEntries(players.map(({ uid, name }) => [uid, name]));
    const updates: AtomicUpdateMap = {};
    const delivered = deliveredRef.current;

    for (const actorUid of actorUids) {
      for (const { key, line } of buildPlayerInstantNightResults(resolution, actorUid, playerNames)) {
        const path = firebasePaths.gamePlayerInstantNightResult(gameId, actorUid, nightId, key);
        const fingerprint = JSON.stringify(line);
        if (delivered.get(path) === fingerprint) continue;
        delivered.set(path, fingerprint);
        updates[path] = { nightNumber, line, createdAt: Date.now() } satisfies PlayerInstantNightResultRecord;
      }
    }

    if (Object.keys(updates).length === 0) return;
    applyAtomicUpdate(updates).catch((error: unknown) => {
      for (const path of Object.keys(updates)) delivered.delete(path);
      console.error("[useDeliverInstantNightResults] Falha ao entregar resultados.", { error, gameId, nightId });
    });
  }, [applied, assignments, entries, gameId, nightId, nightNumber, players, resolution]);
}
