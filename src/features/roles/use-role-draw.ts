"use client";

import { useRef, useState } from "react";

import { getRoleAssignmentErrorMessage } from "./role-assignment-error";
import type { RoleCompositionValidationResult } from "./validate-role-composition";

export interface RoleDrawFeedback {
  kind: "error" | "success";
  message: string;
}

export interface UseRoleDrawResult {
  drawing: boolean;
  feedback: RoleDrawFeedback | null;
  start: (
    gameId: string,
    validation: RoleCompositionValidationResult,
  ) => Promise<void>;
  clearFeedback: () => void;
}

export function useRoleDraw(): UseRoleDrawResult {
  const drawInProgress = useRef(false);
  const [drawing, setDrawing] = useState(false);
  const [feedback, setFeedback] = useState<RoleDrawFeedback | null>(null);

  const start = async (
    gameId: string,
    validation: RoleCompositionValidationResult,
  ) => {
    if (drawInProgress.current || !validation.valid) {
      return;
    }

    drawInProgress.current = true;
    setDrawing(true);
    setFeedback(null);

    try {
      const { drawAndPersistRoles } = await import("./draw-and-persist-roles");
      await drawAndPersistRoles(gameId);
      setFeedback({
        kind: "success",
        message:
          "Roles sorteadas e salvas com segurança. Cada jogador já pode consultar sua própria role.",
      });
    } catch (error: unknown) {
      setFeedback({
        kind: "error",
        message: getRoleAssignmentErrorMessage(error),
      });
    } finally {
      drawInProgress.current = false;
      setDrawing(false);
    }
  };

  return {
    drawing,
    feedback,
    start,
    clearFeedback: () => setFeedback(null),
  };
}
