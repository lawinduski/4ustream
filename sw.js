const CACHE = '4ustream-shell-v2';
const SHELL = [
  '/', '/live.html', '/films.html', '/drama.html', '/account.html',
  '/manifest.webmanifest', '/css/style.css',
  '/js/app.js', '/js/icons.js', '/js/firebase-init.js', '/js/i18n.js',
  '/js/access.js', '/js/content.js', '/js/ads.js', '/js/favorites.js', '/js/player.js',
  '/data/i18n.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Network-first for HTML so content updates show immediately; cache-first for static assets.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
