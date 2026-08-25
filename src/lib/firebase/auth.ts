"use client";

import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

import { firebaseApp } from "./client";

export const firebaseAuth: Auth = getAuth(firebaseApp);

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  connectAuthEmulator(
    firebaseAuth,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL ?? "http://127.0.0.1:9099",
    { disableWarnings: true },
  );
}
