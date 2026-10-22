// Minimal service worker: makes the app installable. No offline caching on purpose —
// the game is realtime (Firebase), stale cached screens would do more harm than good.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
