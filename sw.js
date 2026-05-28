// Lam Tuyen Linen — Service Worker
// Bump version string to force cache refresh on next deploy
const CACHE_NAME = 'lt-linen-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// ── Install: precache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Precache failed:', err))
  );
});

// ── Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first with cache fallback
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Skip non-http(s) requests (chrome-extension://, etc.)
  if (!req.url.startsWith('http')) return;

  // For Google Fonts and other CDN requests: cache-first
  const isCDN = req.url.includes('fonts.googleapis.com') ||
                req.url.includes('fonts.gstatic.com');

  if (isCDN) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Same-origin requests: network-first, fall back to cache
  if (req.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Cache successful responses
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          // Network failed — serve from cache
          return caches.match(req).then(cached => {
            if (cached) return cached;
            // Offline fallback for navigation requests
            if (req.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
        })
    );
  }
});
