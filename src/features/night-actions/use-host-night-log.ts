"use client";

import { useEffect, useState } from "react";

import type { HostNightActionEntry, HostNightNote, NightResolutionRecord, NightSession } from "@/types";

interface HostNightLogState {
  key: string;
  actions: Record<string, HostNightActionEntry>;
  allActions: Record<string, Record<string, HostNightActionEntry>>;
  notes: Record<string, HostNightNote>;
  session: NightSession | null;
  resolutions: Record<string, NightResolutionRecord>;
  actionsLoaded: boolean;
  allActionsLoaded: boolean;
  notesLoaded: boolean;
  sessionLoaded: boolean;
  resolutionsLoaded: boolean;
  error: Error | null;
}

export function useHostNightLog(gameId: string, nightId: string, hostUid: string) {
  const key = `${gameId}:${nightId}:${hostUid}`;
  const [state, setState] = useState<HostNightLogState>({
    key,
    actions: {},
    allActions: {},
    notes: {},
    session: null,
    resolutions: {},
    actionsLoaded: false,
    allActionsLoaded: false,
    notesLoaded: false,
    sessionLoaded: false,
    resolutionsLoaded: false,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const unsubscribers: Array<() => void> = [];

    void import("@/lib/firebase/realtime-database-repository").then((repository) => {
      if (!active) return;
      const onError = (error: Error) => active && setState((current) => ({ ...current, key, error }));
      unsubscribers.push(
        repository.observeHostNightActions(gameId, nightId, hostUid, {
          onData: (actions) => active && setState((current) => ({ ...current, key, actions: actions ?? {}, actionsLoaded: true })),
          onError,
        }),
        repository.observeHostAllNightActions(gameId, hostUid, {
          onData: (allActions) =>
            active &&
            setState((current) => ({
              ...current,
              key,
              allActions: allActions ?? {},
              allActionsLoaded: true,
            })),
          onError,
        }),
        repository.observeHostNotes(gameId, nightId, hostUid, {
          onData: (notes) => active && setState((current) => ({ ...current, key, notes: notes ?? {}, notesLoaded: true })),
          onError,
        }),
        repository.observeHostNightSession(gameId, nightId, hostUid, {
          onData: (session) => active && setState((current) => ({ ...current, key, session, sessionLoaded: true })),
          onError,
        }),
        repository.observeHostNightResolutions(gameId, hostUid, {
          onData: (resolutions) => active && setState((current) => ({
            ...current,
            key,
            resolutions: resolutions ?? {},
            resolutionsLoaded: true,
          })),
          onError,
        }),
      );
    }).catch((unknownError: unknown) => {
      if (active) setState((current) => ({ ...current, key, error: unknownError instanceof Error ? unknownError : new Error("Night log unavailable") }));
    });

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [gameId, hostUid, key, nightId]);

  if (state.key !== key) {
    return { actions: {}, allActions: {}, notes: {}, session: null, resolutions: {}, loaded: false, error: null };
  }

  return {
    actions: state.actions,
    allActions: state.allActions,
    notes: state.notes,
    session: state.session,
    resolutions: state.resolutions,
    loaded:
      state.actionsLoaded &&
      state.allActionsLoaded &&
      state.notesLoaded &&
      state.sessionLoaded &&
      state.resolutionsLoaded,
    error: state.error,
  };
}
