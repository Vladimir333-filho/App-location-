/* QuotaMob service worker: no private API/data is cached. */
const SW_VERSION = 'quotamob-pwa-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('quotamob-') && key !== SW_VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text?.() || 'Tens uma nova actualização no QuotaMob.' };
  }
  const title = payload.title || 'QuotaMob';
  const options = {
    body: payload.body || 'Tens uma nova notificação.',
    icon: '/icons/quotamob-512.png',
    badge: '/icons/quotamob-512.png',
    tag: payload.tag || 'quotamob-notification',
    renotify: Boolean(payload.renotify),
    data: { url: payload.url || '/admin/aprovacoes' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/admin/aprovacoes', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.navigate(target);
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
