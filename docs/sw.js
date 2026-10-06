// Keeps a copy of the app on the phone so it opens with no signal.
// The saved copy is shown straight away and refreshed in the background, so an update appears on the next launch.
const CACHE = "weekly-workout-v1";
const SHELL = ["./", "manifest.webmanifest", "icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // sync requests go straight to GitHub
  const key = e.request.mode === "navigate" ? "./" : e.request;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const saved = await cache.match(key);
    const fresh = fetch(e.request).then(r => {
      if (r.ok) cache.put(key, r.clone());
      return r;
    });
    if (!saved) return fresh;
    fresh.catch(() => {});
    return saved;
  }));
});
