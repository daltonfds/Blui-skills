const CACHE_NAME = "bluiskill-shell-v3";
const OFFLINE_URL = "/offline";
const APP_ICON = "/icon.svg";
const OFFICIAL_LOGO = "/images/logo.png";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.add(OFFLINE_URL);
        await cache.add(APP_ICON).catch(() => undefined);
        await cache.add(OFFICIAL_LOGO).catch(() => undefined);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("bluiskill-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Always fetch Next.js chunks from the network. Serving an old cached JS chunk
  // after a deployment can cause a client-side exception during hydration.
  if (url.pathname.startsWith("/_next/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return cached || new Response("Estás offline. Volta a ligar-te à internet e tenta novamente.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
    );
    return;
  }

  if (url.pathname === APP_ICON) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(APP_ICON);
        return cached || new Response("", { status: 503 });
      })
    );
  }
});
