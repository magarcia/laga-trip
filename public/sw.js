// Offline cache for the Laga trip app. Bump CACHE on every content change.
const CACHE = "laga-trip-v4";
const ASSETS = [
  "/", "/index.html", "/styles.css", "/app.js", "/manifest.webmanifest", "/icon.svg",
  "/fonts/bricolage-700.woff2", "/fonts/bricolage-800.woff2",
  "/fonts/geist-400.woff2", "/fonts/geist-500.woff2", "/fonts/geist-600.woff2",
  "/fonts/geistmono-500.woff2",
  "/img/surf-hero.jpg", "/img/walkout.jpg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin GET: network-first (fresh online), cache fallback offline.
// Cross-origin (Maps embeds, AEMET, Splitwise): never intercept.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Only cache genuine same-origin 200s; a 5xx/redirect must not poison the cache.
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((r) => {
          if (r) return r;
          // App-shell fallback only for navigations; a missing asset must not decode as HTML.
          if (e.request.mode === "navigate") return caches.match("/");
          return Response.error();
        })
      )
  );
});
