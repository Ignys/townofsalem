"use client";

import { useEffect, useState } from "react";

import type { HostNightActionEntry, NightResolutionRecord, NightSession } from "@/types";
import type { StoredGameEvent } from "@/lib/firebase/schema";

interface HistoryState {
  key: string;
  sessions: Record<string, NightSession>;
  actions: Record<string, Record<string, HostNightActionEntry>>;
  resolutions: Record<string, NightResolutionRecord>;
  events: Record<string, StoredGameEvent>;
  loaded: number;
  error: Error | null;
}

interface HostHistoryView {
  sessions: Record<string, NightSession>;
  actions: Record<string, Record<string, HostNightActionEntry>>;
  resolutions: Record<string, NightResolutionRecord>;
  events: Record<string, StoredGameEvent>;
  loaded: boolean;
  error: Error | null;
}

export function useHostHistory(gameId: string, hostUid: string): HostHistoryView {
  const key = `${gameId}:${hostUid}`;
  const [state, setState] = useState<HistoryState>({ key, sessions: {}, actions: {}, resolutions: {}, events: {}, loaded: 0, error: null });

  useEffect(() => {
    let active = true;
    const unsubscribers: Array<() => void> = [];
    const reportError = (value: Error) => active && setState((current) => ({ ...current, key, error: value }));
    void import("@/lib/firebase/realtime-database-repository").then((repository) => {
      if (!active) return;
      const bind = <Field extends "sessions" | "actions" | "resolutions" | "events">(field: Field) => ({
        onData: (value: HistoryState[Field] | null) => active && setState((current) => ({ ...current, key, [field]: value ?? {}, loaded: current.loaded + 1 })),
        onError: reportError,
      });
      unsubscribers.push(
        repository.observeHostNightSessions(gameId, hostUid, bind("sessions")),
        repository.observeHostAllNightActions(gameId, hostUid, bind("actions")),
        repository.observeHostNightResolutions(gameId, hostUid, bind("resolutions")),
        repository.observeHostEvents(gameId, hostUid, bind("events")),
      );
    }).catch((value: unknown) => reportError(value instanceof Error ? value : new Error("History unavailable")));
    return () => { active = false; unsubscribers.forEach((unsubscribe) => unsubscribe()); };
  }, [gameId, hostUid, key]);

  if (state.key !== key) return { sessions: {}, actions: {}, resolutions: {}, events: {}, loaded: false, error: null };
  return {
    sessions: state.sessions,
    actions: state.actions,
    resolutions: state.resolutions,
    events: state.events,
    loaded: state.loaded >= 4,
    error: state.error,
  };
}
