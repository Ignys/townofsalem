"use client";

import Link from "next/link";
import { useEffect } from "react";

const SCROLL_KEY = "tos:library-scroll";
const RESTORE_KEY = "tos:library-restore";

/** Fica na página /roles: guarda onde a lista está e, voltando de uma role, devolve a rolagem. */
export function LibraryVisitMark() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(RESTORE_KEY) === "1") {
        sessionStorage.removeItem(RESTORE_KEY);
        window.scrollTo({ top: Number(sessionStorage.getItem(SCROLL_KEY)) || 0 });
      }
    } catch {
      // Sem armazenamento, a lista só abre do topo.
    }
    const save = () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      } catch {
        // Idem.
      }
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);
  return null;
}

/** Volta para a lista pedindo que ela restaure a rolagem de antes. */
export function BackToLibraryLink({ className }: Readonly<{ className?: string }>) {
  return (
    <Link
      href="/roles"
      scroll={false}
      onClick={() => {
        try {
          sessionStorage.setItem(RESTORE_KEY, "1");
        } catch {
          // Sem armazenamento, a lista abre do topo.
        }
      }}
      className={className}
    >
      ← Todas as roles
    </Link>
  );
}
