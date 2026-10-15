// Deferred until the PWA phase. The app does not register this worker.
const CACHE = "rankpush-static-v1";
const PRECACHE = ["/", "/offline", "/icons/icon-192.png", "/icons/icon-512.png"];
const PRIVATE_PREFIXES = ["/api", "/dashboard", "/admin", "/auth", "/account", "/payments", "/login", "/signup", "/verify-ownership"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (PRIVATE_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      const cacheable = response.ok && !response.headers.has("set-cookie") && (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/") || url.pathname === "/offline");
      if (cacheable) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        const offline = await caches.match("/offline");
        if (offline) return offline;
      }
      return new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
    }
  })());
});
