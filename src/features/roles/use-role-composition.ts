"use client";

import { useCallback, useEffect, useState } from "react";

import type { GameSettingsRecord } from "@/lib/firebase/schema";

import { compositionRecordToRoleIds } from "./role-composition";
import { saveRoleComposition } from "./role-composition-repository";

interface RoleCompositionState {
  gameId: string | null;
  roleIds: string[];
  loaded: boolean;
  saving: boolean;
  error: Error | null;
}

export interface UseRoleCompositionResult {
  roleIds: readonly string[];
  loaded: boolean;
  saving: boolean;
  error: Error | null;
  updateRoleIds: (roleIds: readonly string[]) => Promise<boolean>;
}

const initialState: RoleCompositionState = {
  gameId: null,
  roleIds: [],
  loaded: false,
  saving: false,
  error: null,
};

export function useRoleComposition(
  gameId: string | null,
): UseRoleCompositionResult {
  const [state, setState] = useState<RoleCompositionState>(initialState);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    let active = true;
    let unsubscribe: () => void = () => undefined;

    void import("@/lib/firebase/realtime-database-repository")
      .then((repository) => {
        if (!active) {
          return;
        }

        unsubscribe = repository.observeGameSettings(gameId, {
          onData: (settings: GameSettingsRecord | null) => {
            if (!active) {
              return;
            }

            setState((current) => ({
              gameId,
              roleIds: compositionRecordToRoleIds(
                settings?.roleComposition,
              ),
              loaded: true,
              saving: current.gameId === gameId && current.saving,
              error: null,
            }));
          },
          onError: (error) => {
            if (active) {
              setState({
                gameId,
                roleIds: [],
                loaded: true,
                saving: false,
                error,
              });
            }
          },
        });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            gameId,
            roleIds: [],
            loaded: true,
            saving: false,
            error:
              error instanceof Error
                ? error
                : new Error("Unknown role composition subscription error."),
          });
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [gameId]);

  const updateRoleIds = useCallback(
    async (nextRoleIds: readonly string[]): Promise<boolean> => {
      if (!gameId || state.gameId !== gameId || state.saving) {
        return false;
      }

      const previousRoleIds = state.roleIds;
      setState((current) => ({
        ...current,
        roleIds: [...nextRoleIds],
        saving: true,
        error: null,
      }));

      try {
        await saveRoleComposition(gameId, nextRoleIds);
        setState((current) => ({ ...current, saving: false }));
        return true;
      } catch (error: unknown) {
        setState((current) => ({
          ...current,
          roleIds: previousRoleIds,
          saving: false,
          error:
            error instanceof Error
              ? error
              : new Error("Unknown role composition persistence error."),
        }));
        return false;
      }
    },
    [gameId, state.gameId, state.roleIds, state.saving],
  );

  if (!gameId || state.gameId !== gameId) {
    return {
      roleIds: [],
      loaded: false,
      saving: false,
      error: null,
      updateRoleIds,
    };
  }

  return {
    roleIds: state.roleIds,
    loaded: state.loaded,
    saving: state.saving,
    error: state.error,
    updateRoleIds,
  };
}
