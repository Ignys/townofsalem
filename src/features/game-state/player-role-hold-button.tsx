"use client";

import { Eye } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { GameVariants } from "@/game-engine/variants";
import type { RoleDefinition } from "@/types";

import { FitToBox } from "./fit-to-box";
import { PlayerRoleCard } from "./player-role-card";

interface PlayerRoleHoldButtonProps {
  role: RoleDefinition;
  variants: GameVariants;
  playerCount: number;
  /** Segredos extras que só aparecem enquanto o botão é segurado (ex.: a equipe da Máfia). */
  secrets?: ReactNode;
}

/**
 * Reveals the role only while the control is physically held down.
 *
 * Releasing, leaving the button, losing focus, backgrounding the tab or any
 * interruption hides it again, so a phone left face-up on the table never keeps
 * a role on screen.
 */
export function PlayerRoleHoldButton({
  role,
  variants,
  playerCount,
  secrets,
}: PlayerRoleHoldButtonProps) {
  const [revealed, setRevealed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hide = useCallback(() => setRevealed(false), []);

  useEffect(() => {
    if (!revealed) return;

    // Anything that takes the player's attention away closes the sheet.
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") hide();
    };
    window.addEventListener("blur", hide);
    window.addEventListener("pointercancel", hide);
    window.addEventListener("pointerup", hide);
    document.addEventListener("visibilitychange", handleVisibility);

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("blur", hide);
      window.removeEventListener("pointercancel", hide);
      window.removeEventListener("pointerup", hide);
      document.removeEventListener("visibilitychange", handleVisibility);
      body.style.overflow = previousOverflow;
    };
  }, [revealed, hide]);

  const reveal = () => setRevealed(true);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Segure para ver sua role"
        aria-pressed={revealed}
        onPointerDown={(event) => {
          // Keep receiving the pointer even if the finger slides off the button.
          event.currentTarget.setPointerCapture?.(event.pointerId);
          reveal();
        }}
        onPointerUp={hide}
        onPointerCancel={hide}
        onLostPointerCapture={hide}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            reveal();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") hide();
        }}
        onBlur={hide}
        onContextMenu={(event) => event.preventDefault()}
        className="fixed inset-x-0 bottom-0 z-40 flex min-h-22 touch-none items-center justify-center gap-3 rounded-t-3xl border-t border-[#d3b88c]/35 bg-[#1a1c1e] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-lg font-bold text-[#e6cfa9] shadow-[0_-12px_32px_rgba(0,0,0,0.45)] select-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#e6cfa9] active:bg-[#2a2620]"
      >
        <Eye aria-hidden="true" className="size-6" />
        Segure para ver sua role
      </button>

      {revealed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sua role secreta"
          onPointerUp={hide}
          onPointerCancel={hide}
          onContextMenu={(event) => event.preventDefault()}
          className="fixed inset-0 z-50 flex touch-none flex-col overflow-hidden bg-[#111315] px-4 py-3 select-none"
        >
          <FitToBox>
            <PlayerRoleCard
              role={role}
              variants={variants}
              playerCount={playerCount}
              secrets={secrets}
            />
          </FitToBox>
          <p className="shrink-0 pt-2 text-center text-xs leading-5 text-[#8f8a82]">
            Solte para esconder. Não mostre sua tela aos outros jogadores.
          </p>
        </div>
      )}
    </>
  );
}
