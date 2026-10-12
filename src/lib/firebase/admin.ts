import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";

let database: Database | null = null;

export function getAdminDatabase(): Database | null {
  if (database) {
    return database;
  }

  const credentials = process.env.SYNC_SERVICE_ACCOUNT;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!credentials || !databaseURL) {
    return null;
  }

  const app: App =
    getApps().find((existing) => existing.name === "sync")
    ?? initializeApp(
      { credential: cert(JSON.parse(credentials)), databaseURL },
      "sync",
    );

  database = getDatabase(app);

  return database;
}
