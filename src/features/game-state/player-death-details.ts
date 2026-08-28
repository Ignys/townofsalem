import {
  formatNightDeathDescription,
  getNightDeathOriginalTargetUid,
} from "@/features/deaths/night-death-description";
import type {
  EngineDeath,
  NightDeathCause,
  NightResolution,
} from "@/game-engine/types";
import type { StoredGameEvent } from "@/lib/firebase/schema";
import type { NightResolutionRecord } from "@/types";

export type PlayerDeathCause =
  | NightDeathCause
  | "hanging"
  | "jester-revenge"
  | "administrative-override"
  | "unrecorded";

export interface PlayerDeathDetails {
  attackerUid?: string;
  cause: PlayerDeathCause;
  description: string;
  occurredAt?: number;
  originalTargetUid?: string;
}

interface DeathCandidate {
  attackerUid?: string;
  cause: PlayerDeathCause;
  occurredAt: number;
  playerUid: string;
  priority: number;
  nightDeath?: EngineDeath;
  nightResolution?: NightResolution;
}

interface GetPlayerDeathDetailsInput {
  events: Readonly<Record<string, StoredGameEvent>>;
  playerNames: Readonly<Record<string, string>>;
  resolutions: Readonly<Record<string, NightResolutionRecord>>;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function describeDeath(
  cause: PlayerDeathCause,
  attackerUid: string | undefined,
  playerNames: Readonly<Record<string, string>>,
): string {
  const attackerName = attackerUid
    ? playerNames[attackerUid] ?? `Jogador ${attackerUid}`
    : undefined;

  switch (cause) {
    case "mafia-attack":
    case "bodyguard-sacrifice":
    case "bodyguard-counterattack":
    case "veteran-attack":
    case "witch-curse":
    case "night-attack":
      return "A causa da morte noturna não possui detalhes suficientes.";
    case "hanging":
      return "Morreu por enforcamento após um veredito de culpado.";
    case "jester-revenge":
      return attackerName
        ? `Morreu para ${attackerName} pela vingança do Jester.`
        : "Morreu pela vingança inevitável do Jester.";
    case "administrative-override":
      return "Foi marcado como morto manualmente pelo mestre.";
    case "unrecorded":
      return "A causa da morte não foi registrada.";
  }
}

function getEventPlayerUid(event: StoredGameEvent): string | undefined {
  return stringValue(objectValue(event.payload)?.playerUid);
}

export function getPlayerDeathDetailsByUid({
  events,
  playerNames,
  resolutions,
}: GetPlayerDeathDetailsInput): Readonly<Record<string, PlayerDeathDetails>> {
  const candidates: DeathCandidate[] = [];
  const revivedAtByPlayer = new Map<string, number>();

  for (const record of Object.values(resolutions)) {
    if (record.rolledBackAt) continue;
    const occurredAt = record.appliedAt ?? record.createdAt;

    for (const death of record.resolution.deathRecords ?? []) {
      candidates.push({
        playerUid: death.targetUid,
        cause: death.cause,
        ...(death.attackerUid ? { attackerUid: death.attackerUid } : {}),
        occurredAt,
        priority: 2,
        nightDeath: death,
        nightResolution: record.resolution,
      });
    }
  }

  for (const event of Object.values(events)) {
    const eventType = String(event.type);
    const payload = objectValue(event.payload);

    if (eventType === "PLAYER_REVIVED_BY_HOST") {
      const playerUid = getEventPlayerUid(event);
      if (playerUid) revivedAtByPlayer.set(playerUid, event.timestamp);
      continue;
    }

    if (eventType === "DAY_RESOLUTION_APPLIED" && Array.isArray(payload?.deaths)) {
      for (const value of payload.deaths) {
        const death = objectValue(value);
        const playerUid = stringValue(death?.targetUid);
        const cause = stringValue(death?.cause);
        if (!playerUid || (cause !== "hanging" && cause !== "jester-revenge")) continue;
        const attackerUid = cause === "jester-revenge"
          ? stringValue(payload.accusedPlayerUid)
          : undefined;
        candidates.push({
          playerUid,
          cause,
          ...(attackerUid ? { attackerUid } : {}),
          occurredAt: event.timestamp,
          priority: 2,
        });
      }
      continue;
    }

    if (eventType !== "PLAYER_DIED") continue;
    const playerUid = getEventPlayerUid(event);
    if (!playerUid) continue;
    candidates.push({
      playerUid,
      cause: payload?.source === "administrative-override"
        ? "administrative-override"
        : "unrecorded",
      occurredAt: event.timestamp,
      priority: payload?.source === "administrative-override" ? 2 : 1,
    });
  }

  const latestByPlayer = new Map<string, DeathCandidate>();
  for (const candidate of candidates.sort(
    (left, right) => left.occurredAt - right.occurredAt || left.priority - right.priority,
  )) {
    if (candidate.occurredAt < (revivedAtByPlayer.get(candidate.playerUid) ?? 0)) {
      continue;
    }
    latestByPlayer.set(candidate.playerUid, candidate);
  }

  return Object.fromEntries(
    [...latestByPlayer].map(([playerUid, death]) => {
      const originalTargetUid = death.nightDeath
        ? getNightDeathOriginalTargetUid(
          death.nightDeath,
          death.nightResolution,
        )
        : undefined;

      return [
        playerUid,
        {
        cause: death.cause,
        description: death.nightDeath
          ? formatNightDeathDescription({
            death: death.nightDeath,
            playerNames,
            resolution: death.nightResolution,
          })
          : describeDeath(death.cause, death.attackerUid, playerNames),
        ...(death.attackerUid ? { attackerUid: death.attackerUid } : {}),
        ...(originalTargetUid ? { originalTargetUid } : {}),
        occurredAt: death.occurredAt,
        },
      ];
    }),
  );
}

export function getUnrecordedPlayerDeathDetails(): PlayerDeathDetails {
  return {
    cause: "unrecorded",
    description: describeDeath("unrecorded", undefined, {}),
  };
}
