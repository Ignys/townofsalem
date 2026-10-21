"use client";

import { GiFangs } from "react-icons/gi";
import { PiKnife } from "react-icons/pi";
import { useMemo } from "react";

import { getRoleById } from "@/data/roles";
import type { NightTargetPicker } from "@/features/night-actions/night-target-picker";
import { FACTION_TAGS, roleTagStyle } from "./game-composition-board";
import type {
  GraveyardEntryRecord,
  PublicPlayerRecord,
} from "@/lib/firebase/schema";

interface PlayerStatusBoardProps {
  players: Readonly<Record<string, PublicPlayerRecord>>;
  viewerUid: string;
  graveyard?: Readonly<Record<string, GraveyardEntryRecord>>;
  /** Mayors que se revelaram: a role deles é pública. */
  mayorReveals?: Readonly<Record<string, number>>;
  /** Abre os detalhes do jogador tocado. */
  onSelectPlayer?: (uid: string) => void;
  /** Fase de acusação: cada vivo ganha o botão de acusar. `null` retira o voto. */
  /** Noite: os alvos válidos da ação em escolha ganham o botão de escolher. */
  nightPick?: NightTargetPicker;
  /** Noite, para a Máfia: quantos parceiros votaram para atacar cada jogador. */
  nightMarks?: Readonly<Record<string, number>>;
  /** De quem são os votos: presas para os Vampiros, faca para a Máfia. */
  nightMarkTeam?: "mafia" | "vampire";
  accusation?: {
    vote: string | null;
    disabled: boolean;
    failed: boolean;
    /** Votos recebidos por jogador vivo, e quantos levam a julgamento. */
    counts: Readonly<Record<string, number>>;
    required: number;
    onAccuse: (uid: string | null) => void;
  };
}

export function RoleTag({ roleId }: Readonly<{ roleId: string }>) {
  const role = getRoleById(roleId);
  return (
    <span
      style={roleTagStyle(roleId)}
      className={`inline-flex max-w-32 shrink-0 truncate rounded-md border px-2 py-0.5 text-[0.6875rem] leading-4 font-semibold uppercase ${
        FACTION_TAGS[role?.faction ?? "neutral"] ?? FACTION_TAGS.neutral
      }`}
    >
      {role?.name ?? roleId}
    </span>
  );
}

function bySeat(
  [, left]: [string, PublicPlayerRecord],
  [, right]: [string, PublicPlayerRecord],
) {
  return (
    (left.seat ?? Number.MAX_SAFE_INTEGER) -
    (right.seat ?? Number.MAX_SAFE_INTEGER)
  );
}

/**
 * Public table state: who is still in, who is out, and where they sit.
 *
 * Living players never show a role — that stays with the host. Dead players do,
 * unless the Janitor cleaned the body, in which case the grave stays anonymous.
 */
export function PlayerStatusBoard({
  players,
  viewerUid,
  graveyard,
  mayorReveals,
  onSelectPlayer,
  accusation,
  nightPick,
  nightMarks,
  nightMarkTeam = "mafia",
}: PlayerStatusBoardProps) {
  const { alive, dead } = useMemo(() => {
    const entries = Object.entries(players).sort(bySeat);
    return {
      alive: entries.filter(([, player]) => player.alive),
      dead: entries.filter(([, player]) => !player.alive),
    };
  }, [players]);

  const panel =
    "rounded-2xl border border-[#e0cfb4] bg-[#f4ead9] p-5 text-[#251f1d] shadow-[0_24px_70px_rgba(0,0,0,0.34)]";

  const renderRow = (
    [uid, player]: [string, PublicPlayerRecord],
    index: number,
  ) => (
    <li key={uid} className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onSelectPlayer?.(uid)}
        aria-label={`Ver detalhes de ${player.name}`}
        className={`flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg py-2 text-left text-sm transition-colors hover:bg-[#ebdfca] focus-visible:outline-3 focus-visible:outline-[#7d2330] ${
          player.alive ? "" : "text-[#8a7a72]"
        }`}
      >
        {/* Only the host can assign seats, so fall back to the listed
          position the same way the host console does. */}
        <span
          title="Assento"
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
            uid === viewerUid
              ? "bg-[#7d2330] text-[#fffaf0]"
              : player.alive
                ? "bg-[#e4d6bf] text-[#3b2a22]"
                : "bg-[#e9dccb] text-[#a3958a]"
          }`}
        >
          {player.seat ?? index + 1}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 font-semibold">
          <span className={`truncate ${player.alive ? "" : "line-through"}`}>
            {player.name}
          </span>
          {uid === viewerUid && (
            <span className="shrink-0 text-xs font-semibold text-[#7d2330]">
              Você
            </span>
          )}
          {player.alive && mayorReveals?.[uid] && <RoleTag roleId="mayor" />}
          {/* Sem "desconectado" aqui: quem passa a noite offline denunciaria que não agiu. */}
          {!player.alive && graveyard?.[uid] && (
            <span className="flex shrink-0">
              {graveyard[uid].cleaned || !graveyard[uid].roleId ? (
                <span className="rounded-md border border-[#c9b89f] px-2 py-0.5 text-[0.6875rem] font-medium text-[#75685f] uppercase">
                  corpo limpo
                </span>
              ) : (
                <RoleTag roleId={graveyard[uid].roleId} />
              )}
            </span>
          )}
        </span>
      </button>
      {accusation && player.alive && (
        <span
          aria-label={`${accusation.counts[uid] ?? 0} de ${accusation.required} votos`}
          className={`shrink-0 text-xs font-bold tabular-nums ${
            (accusation.counts[uid] ?? 0) >= accusation.required
              ? "text-[#7d2330]"
              : "text-[#75685f]"
          }`}
        >
          {accusation.counts[uid] ?? 0}/{accusation.required}
        </span>
      )}
      {accusation && player.alive && uid !== viewerUid && (
        <button
          type="button"
          aria-pressed={accusation.vote === uid}
          aria-label={`${accusation.vote === uid ? "Retirar voto em" : "Votar em"} ${player.name}`}
          disabled={accusation.disabled}
          onClick={() =>
            accusation.onAccuse(accusation.vote === uid ? null : uid)
          }
          className="min-h-9 shrink-0 rounded-lg border border-[#7d2330]/50 px-3 text-xs font-bold text-[#7d2330] transition-colors hover:bg-[#7d2330]/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7d2330] disabled:opacity-50 aria-pressed:border-[#7d2330] aria-pressed:bg-[#7d2330] aria-pressed:text-white"
        >
          {accusation.vote === uid ? "VOTADO" : "VOTAR"}
        </button>
      )}
      {nightMarks?.[uid] ? (
        <span
          aria-label={`${nightMarks[uid]} ${nightMarks[uid] === 1 ? "voto" : "votos"} ${nightMarkTeam === "vampire" ? "dos Vampiros" : "da Máfia"}`}
          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-white tabular-nums ${nightMarkTeam === "vampire" ? "bg-[#4c5a3c]" : "bg-[#7d2330]"}`}
        >
          {nightMarkTeam === "vampire"
            ? <GiFangs aria-hidden="true" className="size-3.5" />
            : <PiKnife aria-hidden="true" className="size-3.5" />}
          {nightMarks[uid]}
        </span>
      ) : null}
      {nightPick?.eligibleUids.includes(uid) && (() => {
        const picked = nightPick.selectedUids.includes(uid);
        // Werewolf: o principal fica cheio como qualquer escolha; o segundo, só tingido, para ver qual é qual.
        const neighbor = picked && nightPick.primaryUid !== undefined && uid !== nightPick.primaryUid;
        const label = !picked
          ? "ESCOLHER"
          : "ESCOLHIDO";
        return (
          <button
            type="button"
            aria-pressed={picked}
            aria-label={`${picked ? "Desmarcar" : "Escolher"} ${player.name}`}
            disabled={nightPick.disabled}
            onClick={() => nightPick.toggle(uid)}
            className={`min-h-9 shrink-0 rounded-lg border px-3 text-xs font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#34405e] disabled:opacity-50 ${
              neighbor
                ? "border-[#34405e] bg-[#34405e]/15 text-[#161b28]"
                : "border-[#34405e] text-[#34405e] hover:bg-[#34405e]/10 aria-pressed:bg-[#161b28] aria-pressed:text-white"
            }`}
          >
            {label}
          </button>
        );
      })()}
    </li>
  );

  return (
    <>
      <section aria-label="Na partida" className={panel}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-base font-semibold">Na partida</h2>
          <span className="rounded-full bg-[#e4d6bf] px-3 py-0.5 text-sm font-bold text-[#3b2a22]">
            {alive.length}
          </span>
        </div>

        {accusation?.failed && (
          <p role="alert" className="mt-1 text-sm text-[#7d2330]">
            Não foi possível registrar seu voto. Tente de novo.
          </p>
        )}

        <ul className="mt-3 divide-y divide-[#d8c8b0]">
          {alive.map((entry, index) => renderRow(entry, index))}
        </ul>
      </section>

      {dead.length > 0 && (
        <section aria-label="Cemitério" className={`${panel} mt-4`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-base font-semibold">Cemitério</h2>
            <span className="rounded-full bg-[#e4d6bf] px-3 py-0.5 text-sm font-bold text-[#3b2a22]">
              {dead.length}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-[#d8c8b0]">
            {/* O índice segue a lista inteira, igual ao console do mestre. */}
            {dead.map((entry, index) => renderRow(entry, alive.length + index))}
          </ul>
        </section>
      )}
    </>
  );
}
