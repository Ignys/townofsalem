"use client";

import { useEffect, useState, type ReactNode } from "react";

import { firebaseAuth } from "@/lib/firebase/auth";

import { AnonymousAuthContext } from "./anonymous-auth-context";
import {
  createAnonymousAuthError,
  ensureAnonymousUser,
  observeAuthState,
} from "./firebase-anonymous-auth";
import type { AnonymousAuthState } from "./types";

const initialAuthState: AnonymousAuthState = {
  isLoading: true,
  uid: null,
  error: null,
};

interface AnonymousAuthProviderProps {
  children: ReactNode;
}

export function AnonymousAuthProvider({
  children,
}: AnonymousAuthProviderProps) {
  const [authState, setAuthState] =
    useState<AnonymousAuthState>(initialAuthState);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = observeAuthState(firebaseAuth, (user) => {
      if (!isActive) {
        return;
      }

      if (user) {
        setAuthState({ isLoading: false, uid: user.uid, error: null });
        return;
      }

      setAuthState(initialAuthState);

      void ensureAnonymousUser(firebaseAuth).catch((cause: unknown) => {
        if (!isActive) {
          return;
        }

        setAuthState({
          isLoading: false,
          uid: null,
          error: createAnonymousAuthError(cause),
        });
      });
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  return (
    <AnonymousAuthContext.Provider value={authState}>
      {children}
    </AnonymousAuthContext.Provider>
  );
}
