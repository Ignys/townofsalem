"use client";

import type { ReactNode } from "react";

import { AnonymousAuthProvider } from "@/features/auth";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <AnonymousAuthProvider>{children}</AnonymousAuthProvider>;
}
