const CACHE_NAME = "nealarp-v2-18";
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
        Promise.all(
          keys
            .filter((key) => key.startsWith("nealarp-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // RSC responses and dev sources must never be confused with cached page documents.
  if (
    request.headers.has("RSC") ||
    url.searchParams.has("_rsc") ||
    url.pathname.includes("webpack-hmr") ||
    url.pathname.startsWith(`${BASE_PATH}/_next/static/chunks/webpack`)
  )
    return;
  const navigation = request.mode === "navigate";
  const asset = /\.(webp|png|jpe?g|svg|css|js|woff2?)$/.test(url.pathname);
  if (!navigation && !asset) return;
  const immutable = url.pathname.startsWith(`${BASE_PATH}/_next/static/`);
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (immutable && cached) return cached;
      // Fresh documents and game art online, cached fallback offline. Never cache-first HTML.
      try {
        const response = await fetch(request, immutable ? undefined : { cache: "no-cache" });
        if (response.ok && (navigation || asset)) {
          event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
        }
        if (!response.ok && cached) return cached;
        return response;
      } catch {
        return (
          cached ||
          new Response("Offline: this page is not cached yet.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }
    })()
  );
});
