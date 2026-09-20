const CACHE = '4ustream-shell-v2026.09.17-2';
const VERSIONED = '?v=2026.09.17-2';
const SHELL = [
  '/', '/live.html', '/films.html', '/drama.html', '/account.html',
  '/manifest.webmanifest', `/css/style.css${VERSIONED}`,
  `/js/app.js${VERSIONED}`, `/js/icons.js${VERSIONED}`, `/js/firebase-init.js${VERSIONED}`, `/js/i18n.js${VERSIONED}`,
  `/js/access.js${VERSIONED}`, `/js/content.js${VERSIONED}`, `/js/ads.js${VERSIONED}`, `/js/favorites.js${VERSIONED}`, `/js/player.js${VERSIONED}`,
  '/data/i18n.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Always prefer fresh HTML. This prevents an old shell from surviving a deployment.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => response)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Versioned CSS/JS/images can safely be cache-first for fast repeat visits.
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      });
    })
  );
});
