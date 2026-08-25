"use client";

import { connectDatabaseEmulator, getDatabase, type Database } from "firebase/database";

import { firebaseApp } from "./client";
import { getFirebaseDatabaseUrl } from "./config";

export const firebaseDatabase: Database = getDatabase(
  firebaseApp,
  getFirebaseDatabaseUrl(),
);

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  const [host, port] = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_HOST ?? "127.0.0.1:9000").split(":");
  connectDatabaseEmulator(firebaseDatabase, host, Number(port));
}
