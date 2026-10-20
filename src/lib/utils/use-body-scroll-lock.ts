import { useEffect } from "react";

/** Trava o scroll da página de fundo enquanto o componente (um modal) estiver montado. */
export function useBodyScrollLock() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);
}
