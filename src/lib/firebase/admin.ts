import "server-only";

import { createSign } from "node:crypto";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";

import { parseServiceAccount } from "./parse-service-account";

let database: Database | null = null;

function getAdminApp(): App | null {
  const credentials = process.env.SYNC_SERVICE_ACCOUNT;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!credentials || !databaseURL) {
    return null;
  }

  const existing = getApps().find((app) => app.name === "sync");

  if (existing) {
    return existing;
  }

  try {
    return initializeApp(
      { credential: cert(parseServiceAccount(credentials)), databaseURL },
      "sync",
    );
  } catch (error: unknown) {
    console.error("SYNC_SERVICE_ACCOUNT is not a valid service account", error);
    return null;
  }
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

const CUSTOM_TOKEN_AUDIENCE =
  "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

/**
 * Token para `signInWithCustomToken`, assinado com a chave da service account. Não usa
 * firebase-admin/auth: na Vercel ele não carrega (jwks-rsa faz require() do jose, que é ESM).
 */
export function createCustomToken(uid: string): string | null {
  const credentials = process.env.SYNC_SERVICE_ACCOUNT;

  if (!credentials) {
    return null;
  }

  const account = parseServiceAccount(credentials) as {
    client_email?: string;
    private_key?: string;
  };

  if (!account.client_email || !account.private_key) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: account.client_email,
      sub: account.client_email,
      aud: CUSTOM_TOKEN_AUDIENCE,
      iat: now,
      exp: now + 3600,
      uid,
    }),
  );
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign(account.private_key);

  return `${header}.${payload}.${base64Url(signature)}`;
}
