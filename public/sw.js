const CACHE_NAME = 'medieat-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './database.js',
  './medieat-api.js',
  './medieat-sync.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls: always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Everything else: cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
