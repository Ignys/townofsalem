"use client";

import { Moon, Sunrise } from "lucide-react";
import type { ReactNode } from "react";

import type { PlayerNightResultLine } from "@/types";

import { NightResolutionMessage } from "./night-resolution-message";
import { usePlayerDawnNightResults } from "./use-player-night-results";

function ResultLines({
  lines,
  light = false,
}: Readonly<{ lines: readonly PlayerNightResultLine[]; light?: boolean }>) {
  return (
    <ul className="mt-3 grid gap-1.5 text-sm leading-6">
      {lines.map((line, index) => (
        <li
          key={index}
          className={`border-l-2 pl-3 ${light ? "border-[#7d2330]/60" : "border-[#c9d4ef]/40"}`}
        >
          <NightResolutionMessage line={line} light={light} />
        </li>
      ))}
    </ul>
  );
}

function CardTitle({
  icon,
  title,
  nightNumber,
  light = false,
}: Readonly<{ icon: ReactNode; title: string; nightNumber: number; light?: boolean }>) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className={light ? "text-[#7d2330]" : "text-[#c9d4ef]"}>
        {icon}
      </span>
      <h2 className={`font-serif text-lg font-semibold ${light ? "" : "text-[#fffaf0]"}`}>{title}</h2>
      <span className={`ml-auto text-xs font-semibold ${light ? "text-[#75685f]" : "text-[#a9b3cc]"}`}>
        Noite {nightNumber}
      </span>
    </div>
  );
}

/** O que a cidade e o próprio jogador descobrem quando a noite acaba. */
export function PlayerDawnNightResults({
  gameId,
  revealed,
}: Readonly<{ gameId: string; revealed: boolean }>) {
  const { announcement, dawnResult } = usePlayerDawnNightResults(gameId, revealed);
  if (!announcement) return null;

  return (
    <>
      {dawnResult && (
        <section
          aria-label="Sua noite"
          className="panel-private mt-4"
        >
          <CardTitle icon={<Moon className="size-4" />} title="Sua noite" nightNumber={dawnResult.nightNumber} />
          <ResultLines lines={dawnResult.lines} />
        </section>
      )}

      <section
        aria-label="Anúncios do dia"
        className="panel-public mt-4"
      >
        <CardTitle
          icon={<Sunrise className="size-4" />}
          title="Anúncios desse dia"
          nightNumber={announcement.nightNumber}
          light
        />
        <ResultLines lines={announcement.lines} light />
      </section>
    </>
  );
}
