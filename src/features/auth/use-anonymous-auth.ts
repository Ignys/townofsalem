"use client";

import { useContext } from "react";

import { AnonymousAuthContext } from "./anonymous-auth-context";

export function useAnonymousAuth() {
  const authState = useContext(AnonymousAuthContext);

  if (!authState) {
    throw new Error(
      "useAnonymousAuth must be used within AnonymousAuthProvider.",
    );
  }

  return authState;
}
