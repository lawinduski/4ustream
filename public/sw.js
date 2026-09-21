const CACHE = '4ustream-shell-v2026.09.21-1';
const RUNTIME = '4ustream-runtime-v2026.09.21-1';
const OFFLINE = ['/manifest.webmanifest'];
const MAX_RUNTIME_ENTRIES = 40;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(OFFLINE))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE && key !== RUNTIME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

async function trimRuntimeCache() {
  const cache = await caches.open(RUNTIME);
  const keys = await cache.keys();
  if (keys.length <= MAX_RUNTIME_ENTRIES) return;

  const removeCount = keys.length - MAX_RUNTIME_ENTRIES;
  await Promise.all(keys.slice(0, removeCount).map((key) => cache.delete(key)));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API responses or Firebase/runtime data.
  if (url.pathname.startsWith('/api/')) return;

  // Always prefer fresh HTML. Old HTML is only used when the device is offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => response)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Next static assets are immutable and safe to serve from cache after first load.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE)
              .then((cache) => cache.put(event.request, copy))
              .catch(() => {});
          }
          return response;
        });
      })
    );
    return;
  }

  // Cache only local, non-HTML visual assets. External streaming/media URLs
  // are intentionally untouched.
  if (/\.(?:png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME)
              .then(async (cache) => {
                await cache.put(event.request, copy);
                await trimRuntimeCache();
              })
              .catch(() => {});
          }
          return response;
        });
      })
    );
  }
});
