import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getDatabase, type Database } from "firebase-admin/database";

let database: Database | null = null;

function getAdminApp(): App | null {
  const credentials = process.env.SYNC_SERVICE_ACCOUNT;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!credentials || !databaseURL) {
    return null;
  }

  return getApps().find((existing) => existing.name === "sync")
    ?? initializeApp(
      { credential: cert(JSON.parse(credentials)), databaseURL },
      "sync",
    );
}

export function getAdminDatabase(): Database | null {
  if (database) {
    return database;
  }

  const app = getAdminApp();

  if (!app) {
    return null;
  }

  database = getDatabase(app);

  return database;
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();

  return app ? getAuth(app) : null;
}
