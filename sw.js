// Bump CACHE_NAME on every release so old caches get cleared and clients pick up new files.
const CACHE_NAME = 'takisplan-cache-v19';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first: always try to get the freshest file when online, fall back to cache when offline.
// cache:'reload' forces the browser to bypass its own HTTP cache and hit the network directly,
// so updates show up immediately instead of waiting on GitHub Pages' CDN cache headers.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Never touch cross-origin traffic (GitHub API sync calls) — let it go straight
  // to the network, uncached. Caching those would serve stale vault data.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request, { cache: 'reload' })
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
