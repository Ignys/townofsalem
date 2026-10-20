"use client";

import { Eye } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { GameVariants } from "@/game-engine/variants";
import type { RoleDefinition } from "@/types";

import { FitToBox } from "./fit-to-box";
import { PlayerRoleCard } from "./player-role-card";

// Fração da altura da tela a partir da qual soltar prende a folha aberta.
const LOCK_THRESHOLD = 0.85;

interface PlayerRoleHoldButtonProps {
  role: RoleDefinition;
  variants: GameVariants;
  playerCount: number;
  /** Segredos extras que só aparecem enquanto o botão é segurado (ex.: a equipe da Máfia). */
  secrets?: ReactNode;
}

/**
 * Reveals the role while the player drags up from the bottom bar; the sheet
 * follows the finger, so the player controls how much of it shows.
 *
 * Released near the top, the sheet locks open like a normal screen; dragging it
 * back down past the threshold hides it. Releasing anywhere lower, losing focus,
 * backgrounding the tab or any interruption hides it, so a phone left face-up on
 * the table never keeps a role on screen unless the player chose to lock it.
 */
export function PlayerRoleHoldButton({
  role,
  variants,
  playerCount,
  secrets,
}: PlayerRoleHoldButtonProps) {
  // Pixels the sheet is pulled up; 0 means hidden.
  const [offset, setOffset] = useState(0);
  // Where the current drag started: finger position and sheet offset at that moment.
  const dragRef = useRef<{ y: number; offset: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Folha solta antes do topo: continua montada enquanto desce animada.
  const [closing, setClosing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const revealed = offset > 0 || closing;

  // Interrupções (aba trocada, foco perdido) somem na hora, sem animação.
  const hide = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
    setClosing(false);
    setOffset(0);
  }, []);

  // Soltar perto do topo prende a folha aberta; em qualquer outro ponto, esconde.
  const release = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
    setOffset((current) => {
      if (current >= window.innerHeight * LOCK_THRESHOLD) return window.innerHeight;
      if (current > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setClosing(true);
      }
      return 0;
    });
  }, []);

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    // Keep receiving the pointer even if the finger slides off the element.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { y: event.clientY, offset };
    setDragging(true);
    setClosing(false);
  };

  const moveDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const next = drag.offset + drag.y - event.clientY;
    setOffset(Math.min(Math.max(next, 0), window.innerHeight));
  };

  useEffect(() => {
    if (!revealed) return;

    // Anything that takes the player's attention away closes the sheet.
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") hide();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    window.addEventListener("blur", hide);
    window.addEventListener("pointercancel", hide);
    window.addEventListener("pointerup", release);
    window.addEventListener("keydown", handleKey);
    document.addEventListener("visibilitychange", handleVisibility);

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("blur", hide);
      window.removeEventListener("pointercancel", hide);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("visibilitychange", handleVisibility);
      body.style.overflow = previousOverflow;
    };
  }, [revealed, hide, release]);

  const revealFully = () => setOffset(window.innerHeight);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Arraste pra cima pra ver sua role"
        aria-pressed={revealed}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={release}
        onPointerCancel={hide}
        onLostPointerCapture={release}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            revealFully();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") hide();
        }}
        onBlur={release}
        onContextMenu={(event) => event.preventDefault()}
        className="fixed inset-x-0 bottom-0 z-40 flex min-h-22 touch-none items-center justify-center gap-3 rounded-t-3xl border-t border-[#d3b88c]/35 bg-[#1a1c1e] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-lg font-bold text-[#e6cfa9] shadow-[0_-12px_32px_rgba(0,0,0,0.45)] select-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#e6cfa9] active:bg-[#2a2620]"
      >
        <Eye aria-hidden="true" className="size-6" />
        Arraste pra cima pra ver sua role
      </button>

      {revealed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sua role secreta"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={release}
          onPointerCancel={hide}
          onContextMenu={(event) => event.preventDefault()}
          style={{ transform: `translateY(max(0px, calc(100% - ${offset}px)))` }}
          onTransitionEnd={() => setClosing(false)}
          className={`${dragging ? "" : "transition-transform duration-300 ease-out motion-reduce:transition-none"} fixed inset-0 z-50 flex touch-none flex-col overflow-hidden rounded-t-3xl bg-[#111315] px-4 py-3 select-none`}
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
            {offset >= window.innerHeight
              ? "Arraste pra baixo para esconder. Não mostre sua tela aos outros jogadores."
              : "Puxe até o topo para fixar, ou solte para esconder."}
          </p>
        </div>
      )}
    </>
  );
}
