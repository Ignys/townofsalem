"use client";

import { getRoleById } from "@/data/roles";
import { getEffectiveVerdicts } from "@/features/voting/voter-rules";
import { findWatchingExecutioners } from "@/game-engine/role-rules";
import {
  readGameDayVotes,
  readGamePlayers,
  readHostPrivatePlayers,
  readPublicGame,
} from "@/lib/firebase/game-access-repository";
import { firebasePaths } from "@/lib/firebase/paths";
import { applyAtomicUpdate, type AtomicUpdateMap } from "@/lib/firebase/realtime-database-repository";

import { buildGraveyardEntry } from "./graveyard-entry";
import { requireAuthenticatedGameHost } from "./require-authenticated-game-host";

export const JESTER_REVENGE_STATUS = "jester-revenge-pending";

/**
 * Fecha a vingança do Jester enforcado: mata o eleitor escolhido (se ele votou culpado de
 * verdade e está vivo) e encerra a pendência. Sem escolha, a vingança simplesmente não acontece.
 */
export async function applyJesterRevenge(
  gameId: string,
  jesterUid: string,
  targetUid: string | null,
  now: number = Date.now(),
): Promise<void> {
  const hostUid = await requireAuthenticatedGameHost(gameId);
  const game = await readPublicGame(gameId);
  if (game?.status !== "in-progress") return;

  const [players, privatePlayers, dayVotes] = await Promise.all([
    readGamePlayers(gameId),
    readHostPrivatePlayers(gameId),
    readGameDayVotes(gameId, game.day),
  ]);
  if (!privatePlayers?.[jesterUid]?.statuses?.[JESTER_REVENGE_STATUS]) return;

  // A carta decide o voto efetivo: Peaceful Townie nunca é culpado, Spiteful sempre é.
  const effectiveVerdicts = getEffectiveVerdicts(dayVotes?.verdicts, privatePlayers);
  const eligible = Boolean(
    targetUid
      && targetUid !== jesterUid
      && players?.[targetUid]?.alive
      && effectiveVerdicts[targetUid] === "guilty",
  );

  const updates: AtomicUpdateMap = {
    [firebasePaths.gamePrivatePlayerStatus(gameId, jesterUid, JESTER_REVENGE_STATUS)]: null,
    [firebasePaths.gameEvent(gameId, crypto.randomUUID())]: {
      type: "JESTER_REVENGE_RESOLVED",
      timestamp: now,
      actorUid: hostUid,
      visibility: "host-only",
      payload: { jesterUid, targetUid: eligible ? targetUid : null },
    },
  };
  if (eligible && targetUid) {
    updates[firebasePaths.gamePlayerField(gameId, targetUid, "alive")] = false;
    updates[firebasePaths.gameGraveyardEntry(gameId, targetUid)] = buildGraveyardEntry(
      privatePlayers[targetUid]?.roleId,
      false,
      now,
    );
    // O alvo de um Executioner morreu sem ser enforcado: o Executioner vira Jester.
    const jester = getRoleById("jester");
    const executionerUids = findWatchingExecutioners(
      Object.keys(privatePlayers[targetUid]?.statuses ?? {}),
      (uid) => ({ roleId: privatePlayers[uid]?.roleId, alive: players?.[uid]?.alive && uid !== targetUid }),
    );
    for (const executionerUid of jester ? executionerUids : []) {
      updates[firebasePaths.gamePrivatePlayerField(gameId, executionerUid, "roleId")] = "jester";
      updates[firebasePaths.gamePrivatePlayerField(gameId, executionerUid, "faction")] = jester?.faction;
    }
  }

  await applyAtomicUpdate(updates);
}
