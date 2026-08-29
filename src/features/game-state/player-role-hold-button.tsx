"use client";

import { Eye } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { GameVariants } from "@/game-engine/variants";
import type { RoleDefinition } from "@/types";

import { PlayerRoleCard } from "./player-role-card";

interface PlayerRoleHoldButtonProps {
  role: RoleDefinition;
  variants: GameVariants;
  playerCount: number;
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
        className="fixed right-4 bottom-4 z-40 flex min-h-14 touch-none items-center gap-2 rounded-2xl border border-[#d3b88c]/35 bg-[#1a1c1e] px-5 font-bold text-[#e6cfa9] shadow-[0_12px_32px_rgba(0,0,0,0.45)] select-none active:scale-[0.98] active:bg-[#d3b88c]/15"
      >
        <Eye aria-hidden="true" className="size-5" />
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
          className="fixed inset-0 z-50 grid touch-none place-items-center overflow-y-auto bg-[#111315] p-5 select-none"
        >
          <PlayerRoleCard
            role={role}
            variants={variants}
            playerCount={playerCount}
          />
          <p className="mt-6 text-center text-xs leading-5 text-[#8f8a82]">
            Solte para esconder. Não mostre sua tela aos outros jogadores.
          </p>
        </div>
      )}
    </>
  );
}
