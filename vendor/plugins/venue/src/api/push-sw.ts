import type { PluginApiHandler } from '@devquake/plugin-sdk';

// GET /api/push-sw: the service worker that shows a waiter's push notifications (a table is
// calling) and opens the floor when tapped. Served for the whole app (Service-Worker-Allowed: /).
const WORKER = `self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  event.waitUntil(self.registration.showNotification(data.title || 'Venue', {
    body: data.body || '',
    tag: data.tag || 'venue',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/tablet' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/tablet';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});`;

export const GET: PluginApiHandler = async () =>
  new Response(WORKER, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache',
    },
  });
