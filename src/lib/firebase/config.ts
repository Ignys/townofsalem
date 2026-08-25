import type { FirebaseOptions } from "firebase/app";

const firebaseEnvironment = {
  NEXT_PUBLIC_FIREBASE_API_KEY:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

type FirebaseEnvironmentVariable = keyof typeof firebaseEnvironment;

function getRequiredEnvironmentVariable(
  variable: FirebaseEnvironmentVariable,
): string {
  const value = firebaseEnvironment[variable];

  if (!value) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }

  return value;
}

export const firebaseConfig = {
  apiKey: getRequiredEnvironmentVariable("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getRequiredEnvironmentVariable(
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  ),
  projectId: getRequiredEnvironmentVariable("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getRequiredEnvironmentVariable(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  ),
  messagingSenderId: getRequiredEnvironmentVariable(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  ),
  appId: getRequiredEnvironmentVariable("NEXT_PUBLIC_FIREBASE_APP_ID"),
} satisfies FirebaseOptions;

export function getFirebaseDatabaseUrl(): string {
  return getRequiredEnvironmentVariable("NEXT_PUBLIC_FIREBASE_DATABASE_URL");
}
