"use client";

import { useEffect, type ReactNode } from "react";

import { AnonymousAuthProvider } from "@/features/auth";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    }
  }, []);

  return <AnonymousAuthProvider>{children}</AnonymousAuthProvider>;
}
