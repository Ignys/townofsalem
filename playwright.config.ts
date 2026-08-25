import { defineConfig, devices } from "@playwright/test";

const firebaseEnvironment = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "fake-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-townofsalem.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: "http://127.0.0.1:9000?ns=demo-townofsalem",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-townofsalem",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-townofsalem.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789:web:e2e",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "http://127.0.0.1:9099",
  NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_HOST: "127.0.0.1:9000",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npx firebase emulators:start --project demo-townofsalem --only auth,database",
      url: "http://127.0.0.1:4000",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 120_000,
      env: { ...process.env, ...firebaseEnvironment },
    },
  ],
});
