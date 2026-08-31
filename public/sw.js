// Service Worker — offline-first caching for the hotel app shell.
// Caches: app shell (HTML, JS, CSS, fonts), static assets, images.
// Network-first for API requests, cache-first for static assets.

const CACHE_VERSION = "dar-yasmin-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  "/",
  "/?app=1",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip cross-origin requests (fonts.googleapis etc. — let browser handle)
  if (url.origin !== self.location.origin) return;

  // API requests: network-first, fallback to cache (stale-while-revalidate)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Only cache successful GET responses
          if (res.ok && res.status === 200) {
            const clone = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || new Response("Offline", { status: 503 })))
    );
    return;
  }

  // Static assets: cache-first, fallback to network
  if (req.destination === "image" || req.destination === "style" || req.destination === "script" || req.destination === "font") {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Refresh in background
          fetch(req).then((res) => {
            if (res.ok) caches.open(RUNTIME_CACHE).then((c) => c.put(req, res.clone())).catch(() => {});
          }).catch(() => {});
          return cached;
        }
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        });
      })
    );
    return;
  }

  // Navigation requests (HTML): network-first, fallback to cached root (offline page)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/").then((c) => c || caches.match("/?app=1")))
    );
    return;
  }
});

// Listen for messages from the client (skipWaiting trigger)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
