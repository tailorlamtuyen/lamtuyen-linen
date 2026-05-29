const CACHE = 'lt-v3';

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener('push', e => {
  let d = { title: 'New Order — Lam Tuyen 🧵', body: 'A new order has arrived', count: 1 };
  try { d = { ...d, ...e.data.json() }; } catch(_) {}
  e.waitUntil((async () => {
    await self.registration.showNotification(d.title, {
      body: d.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: 'lt-order',
      renotify: true,
      requireInteraction: false,
      data: { url: '/admin', count: d.count }
    });
    if ('setAppBadge' in navigator) {
      try { await navigator.setAppBadge(d.count); } catch(_) {}
    }
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(all => {
      const a = all.find(c => c.url.includes('/admin'));
      if (a) return a.focus();
      return self.clients.openWindow('/admin');
    })
  );
  if ('clearAppBadge' in navigator) navigator.clearAppBadge().catch(() => {});
});
