const CACHE_NAME = "nealarp-v2-2";
// Derive base path from SW location (e.g. /nealarp/sw.js -> /nealarp/)
const BASE_PATH = new URL(".", self.location).pathname.replace(/\/$/, "") || "";
const ASSETS = [`${BASE_PATH}/`, `${BASE_PATH}/manifest.webmanifest`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Only cache same-origin GET
  if (!request.url.startsWith(self.location.origin)) return;
  // Don't cache API or dev HMR
  if (request.url.includes("/_next/webpack-hmr")) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache successful responses for static assets
          if (response.ok && request.url.match(/\.(webp|png|jpg|jpeg|svg|css|js|woff2?)$/)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone).catch(() => {}));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
