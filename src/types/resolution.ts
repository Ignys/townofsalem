import type { NightResolution } from "@/game-engine/types";
import type { PlayerStatus } from "./player";
import type { Faction } from "./role";

export interface NightResolutionRecord {
  id: string;
  nightId: string;
  actionsRevision: number;
  createdAt: number;
  resolution: NightResolution;
  playerAliveBefore: Readonly<Record<string, boolean>>;
  cleanStatusBefore: Readonly<Record<string, PlayerStatus | null>>;
  appliedStatusBefore?: Readonly<
    Record<string, Readonly<Record<string, PlayerStatus | null>>>
  >;
  roleStateBefore?: Readonly<Record<string, { roleId: string; faction: Faction }>>;
  resourceUsesBefore?: Readonly<Record<string, Readonly<Record<string, number>>>>;
  appliedAt?: number;
  rolledBackAt?: number;
}

/**
 * Mensagens que o jogador recebe sobre a noite. Linhas no mesmo formato da resolução do mestre
 * (`NightResolutionMessageLine`), já escritas para o jogador.
 */
export interface PlayerNightResultLine {
  parts: readonly (
    | { kind: "text"; text: string; tone?: "danger" }
    | { kind: "player"; playerUid: string; text: string; tone?: "danger" }
    | { kind: "role"; roleId: string }
    | { kind: "faction"; faction: "town" | "mafia" | "neutral" }
  )[];
}

/** `playerInstantResults/{uid}/{nightId}/{resultKey}`: entregue quando o jogador confirma. */
export interface PlayerInstantNightResultRecord {
  nightNumber: number;
  line: PlayerNightResultLine;
  createdAt: number;
}

/** `playerDawnResults/{uid}/{nightId}`: escrito ao aplicar, legível fora da noite. */
export interface PlayerDawnNightResultRecord {
  nightNumber: number;
  lines: readonly PlayerNightResultLine[];
  createdAt: number;
}

/** `dayAnnouncements/{nightId}`: o que o mestre anuncia ao amanhecer, legível fora da noite. */
export interface DayAnnouncementRecord {
  nightNumber: number;
  lines: readonly PlayerNightResultLine[];
  createdAt: number;
}

/** `mafiaTeam/{uid}`: quem é da Máfia, visível só para a Máfia. */
export interface MafiaTeamMemberRecord {
  roleId: string;
}

/** `mafiaBoard/{nightId}/{uid}/{actionId}`: escolha ao vivo de um membro; `locked` = confirmada. */
export interface MafiaBoardPickRecord {
  targetUids?: readonly string[];
  locked?: boolean;
  updatedAt: number;
}

/** `mafiaReactions/{nightId}/{id}`: reação rápida enviada à Máfia. */
export interface MafiaReactionRecord {
  uid: string;
  key: string;
  at: number;
  /** Jogador mencionado na reação ("Vamos nele 🔪 → Fulano"). */
  targetUid?: string;
}
